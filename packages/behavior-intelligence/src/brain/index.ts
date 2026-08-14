/**
 * Behavior Intelligence Brain Engine
 * 
 * Architecture:
 * 1. INPUT LAYER: Normalizes raw data
 * 2. PROCESSING LAYER: Runs detectors
 * 3. DECISION LAYER: Applies rules
 * 4. OUTPUT LAYER: Formats results
 */

import {
  BrainInput, NormalizedInput, NormalizedEvent, NormalizedSnapshot,
  SessionMetadata, ProcessingOutput, DecisionOutput, BrainOutput, BrainConfig
} from './types'
import { DEFAULT_BRAIN_CONFIG, getBrainConfig, STRICT_BRAIN_CONFIG, LENIENT_BRAIN_CONFIG, TEST_BRAIN_CONFIG } from './config'
import { RawEditorEvent, RawCodingEvent, RawClipboardMarker, RawSnapshot } from '../types/raw-events'
import { DetectorResult, DetectorInput } from '../types/detector'
import { RuleConfig } from '../types/rules'
import { EngineOutput, BehaviorState } from '../types/engine'
import { getDetector, runDetector } from '../detectors'
import { aggregateDetectorResults } from '../engine/aggregate'

const nowISO = () => new Date().toISOString()

class InputLayer {
  private config: BrainConfig
  constructor(config: BrainConfig) { this.config = config }

  normalize(input: BrainInput): NormalizedInput {
    const events: NormalizedEvent[] = []
    const snapshots: NormalizedSnapshot[] = []
    const languages = new Set<string>()
    let totalCharacters = 0
    let startTime = Infinity
    let endTime = 0
    let totalEvents = 0

    if (this.config.input.useEditorEvents) {
      for (const event of input.editorEvents) {
        const timestamp = new Date(event.createdAt).getTime()
        startTime = Math.min(startTime, timestamp)
        endTime = Math.max(endTime, timestamp)
        totalEvents++
        const payload = event.payload as Record<string, unknown> | null
        let charCount = 0
        let content: string | null = null
        if (payload && typeof payload.text === 'string') {
          charCount = payload.text.length
          content = payload.text
        } else if (payload && Array.isArray(payload.lines)) {
          charCount = (payload.lines as unknown[]).reduce((sum, line) => sum + (typeof line === 'string' ? line.length : 0), 0)
          content = (payload.lines as unknown[]).join('\n')
        }
        totalCharacters += charCount
        events.push({ id: event.id, timestamp, type: this.classifyEventType(event.eventType), position: (payload as any)?.position ?? null, length: charCount, content, source: 'editor', metadata: payload || {} })
      }
    }

    if (this.config.input.useCodingEvents) {
      for (const event of input.codingEvents) {
        const timestamp = new Date(event.createdAt).getTime()
        startTime = Math.min(startTime, timestamp)
        endTime = Math.max(endTime, timestamp)
        totalEvents++
        events.push({ id: event.id, timestamp, type: this.classifyEventType(event.eventType), position: null, length: 0, content: null, source: event.source, metadata: event.metadata })
        if (event.metadata && typeof event.metadata.language === 'string') languages.add(event.metadata.language)
      }
    }

    if (this.config.input.useClipboardMarkers) {
      for (const marker of input.clipboardMarkers) {
        const timestamp = new Date(marker.createdAt).getTime()
        startTime = Math.min(startTime, timestamp)
        endTime = Math.max(endTime, timestamp)
        totalEvents++
        const metadata = marker.metadata as Record<string, unknown> | null
        const charCount = (metadata?.contentLength as number) || 0
        totalCharacters += charCount
        events.push({ id: marker.id, timestamp, type: 'paste', position: null, length: charCount, content: null, source: 'clipboard', metadata: { ...metadata, isInternal: marker.isInternal, markerType: marker.markerType } })
      }
    }

    if (this.config.input.useSnapshots) {
      for (const snapshot of input.snapshots) {
        const timestamp = new Date(snapshot.createdAt).getTime()
        startTime = Math.min(startTime, timestamp)
        endTime = Math.max(endTime, timestamp)
        const content = snapshot.content as Record<string, unknown> | null
        const contentStr = content ? JSON.stringify(content) : ''
        totalCharacters += contentStr.length
        if (snapshot.language) languages.add(snapshot.language)
        snapshots.push({ id: snapshot.id, timestamp, content: contentStr, filePath: snapshot.filePath, language: snapshot.language, hash: snapshot.baseHash || snapshot.sourceHash || null })
      }
    }

    const durationMs = endTime > 0 ? endTime - startTime : 0
    return {
      sessionId: input.sessionId,
      events: events.sort((a, b) => a.timestamp - b.timestamp),
      snapshots: snapshots.sort((a, b) => a.timestamp - b.timestamp),
      metadata: { startTime: startTime === Infinity ? 0 : startTime, endTime: endTime === 0 ? null : endTime, durationMs, totalEvents, totalCharacters, languages }
    }
  }

  private classifyEventType(eventType: string): 'insert' | 'delete' | 'modify' | 'paste' | 'other' {
    const lowerType = eventType.toLowerCase()
    if (lowerType.includes('insert')) return 'insert'
    if (lowerType.includes('delete') || lowerType.includes('remove')) return 'delete'
    if (lowerType.includes('modify') || lowerType.includes('change') || lowerType.includes('update')) return 'modify'
    if (lowerType.includes('paste')) return 'paste'
    return 'other'
  }
}

class ProcessingLayer {
  private config: BrainConfig
  constructor(config: BrainConfig) { this.config = config }

  async process(normalizedInput: NormalizedInput): Promise<ProcessingOutput> {
    const startTime = Date.now()
    const results: ProcessingResult[] = []
    for (const detectorType of this.config.processing.enabledDetectors) {
      const detectorStart = Date.now()
      try {
        const detector = getDetector(detectorType)
        if (!detector) { console.warn(`Detector ${detectorType} not found`); continue }
        const detectorInput: DetectorInput = { sessionId: normalizedInput.sessionId, editorEvents: [], codingEvents: [], clipboardMarkers: [], snapshots: [] }
        const result = await Promise.race([
          detector(detectorInput),
          new Promise<DetectorResult>((resolve) => setTimeout(() => resolve({ detectionType: detectorType, probability: 0, result: { error: 'Timeout' } }), this.config.processing.detectorTimeoutMs))
        ])
        results.push({ detectorType, result, executionTimeMs: Date.now() - detectorStart, timestamp: nowISO() })
      } catch (error) {
        results.push({ detectorType, result: { detectionType: detectorType, probability: 0, result: { error: error instanceof Error ? error.message : String(error) } }, executionTimeMs: Date.now() - detectorStart, timestamp: nowISO() })
      }
    }
    return { sessionId: normalizedInput.sessionId, results, totalExecutionTimeMs: Date.now() - startTime, processedAt: nowISO() }
  }
}

class DecisionLayer {
  private config: BrainConfig
  constructor(config: BrainConfig) { this.config = config }

  decide(processingOutput: ProcessingOutput, ruleConfig: RuleConfig[]): DecisionOutput {
    const detectorResults = processingOutput.results.map(r => r.result)
    const behaviorState = aggregateDetectorResults(detectorResults, ruleConfig)
    const ruleEvaluations = this.evaluateRules(detectorResults, ruleConfig)
    const confidence = this.calculateConfidence(detectorResults, behaviorState)
    return { behaviorState, ruleEvaluations, confidence, decisionTimestamp: nowISO() }
  }

  private evaluateRules(detectorResults: DetectorResult[], ruleConfigs: RuleConfig[]): any[] {
    return ruleConfigs.map(ruleConfig => {
      const detectorResult = detectorResults.find(r => r.detectionType === ruleConfig.condition.detector)
      if (!detectorResult) return null
      const isMet = this.checkCondition(detectorResult.probability, ruleConfig.condition)
      return { ruleId: ruleConfig.ruleId, ruleName: ruleConfig.ruleName, detectorType: ruleConfig.condition.detector, isMet, detectorValue: detectorResult.probability, conditionValue: ruleConfig.condition.value, weight: ruleConfig.action.weight, flag: isMet ? ruleConfig.action.flag : null }
    }).filter(Boolean) as any[]
  }

  private checkCondition(value: number, condition: any): boolean {
    switch (condition.operator) {
      case 'gte': return value >= condition.value
      case 'lte': return value <= condition.value
      case 'gt': return value > condition.value
      case 'lt': return value < condition.value
      case 'eq': return value === condition.value
      default: return false
    }
  }

  private calculateConfidence(detectorResults: DetectorResult[], behaviorState: BehaviorState): number {
    if (detectorResults.length === 0) return 0
    const maxProb = Math.max(...detectorResults.map(r => r.probability))
    const meanProb = detectorResults.reduce((sum, r) => sum + r.probability, 0) / detectorResults.length
    const variance = detectorResults.reduce((sum, r) => sum + Math.pow(r.probability - meanProb, 2), 0) / detectorResults.length
    const stdDev = Math.sqrt(variance)
    const consistencyFactor = 1 - Math.min(1, stdDev / 0.5)
    const strengthFactor = maxProb
    let confidence = consistencyFactor * 0.4 + strengthFactor * 0.6
    if (behaviorState.requiresHumanReview) confidence = Math.min(0.9, confidence * 0.9)
    return Math.round(confidence * 100) / 100
  }
}

class OutputLayer {
  format(sessionId: string, engineVersion: string, decisionOutput: DecisionOutput): BrainOutput {
    const detectorResults = Object.entries(decisionOutput.behaviorState.detectors).map(([detectionType, { score, weight }]) => ({ detectionType, probability: score, result: { score, weight } }))
    return { engineVersion, computedAt: decisionOutput.decisionTimestamp, detectorResults, behaviorState: decisionOutput.behaviorState, sessionId }
  }

  toEngineOutput(brainOutput: BrainOutput): EngineOutput {
    return { engineVersion: brainOutput.engineVersion, computedAt: brainOutput.computedAt, detectorResults: brainOutput.detectorResults, behaviorState: brainOutput.behaviorState }
  }
}

export class BrainEngine {
  private config: BrainConfig
  private inputLayer: InputLayer
  private processingLayer: ProcessingLayer
  private decisionLayer: DecisionLayer
  private outputLayer: OutputLayer

  constructor(config: Partial<BrainConfig> = {}) {
    this.config = { ...DEFAULT_BRAIN_CONFIG, ...config }
    this.inputLayer = new InputLayer(this.config)
    this.processingLayer = new ProcessingLayer(this.config)
    this.decisionLayer = new DecisionLayer(this.config)
    this.outputLayer = new OutputLayer()
  }

  async process(input: BrainInput): Promise<{ engineOutput: EngineOutput; brainOutput: BrainOutput }> {
    const normalizedInput = this.inputLayer.normalize(input)
    const processingOutput = await this.processingLayer.process(normalizedInput)
    const decisionOutput = this.decisionLayer.decide(processingOutput, input.ruleConfig)
    const brainOutput = this.outputLayer.format(input.sessionId, input.engineVersion, decisionOutput)
    const engineOutput = this.outputLayer.toEngineOutput(brainOutput)
    return { engineOutput, brainOutput }
  }

  static async processWithConfig(input: BrainInput, config: Partial<BrainConfig> = {}): Promise<{ engineOutput: EngineOutput; brainOutput: BrainOutput }> {
    const brain = new BrainEngine(config)
    return brain.process(input)
  }

  getConfig(): BrainConfig { return this.config }
}

export function createBrain(config?: Partial<BrainConfig>): BrainEngine { return new BrainEngine(config) }

export function createBrainWithPreset(preset: 'default' | 'strict' | 'lenient' | 'test'): BrainEngine { return new BrainEngine(getBrainConfig(preset)) }

export { DEFAULT_BRAIN_CONFIG, STRICT_BRAIN_CONFIG, LENIENT_BRAIN_CONFIG, TEST_BRAIN_CONFIG, getBrainConfig }
export type { BrainInput, NormalizedInput, NormalizedEvent, NormalizedSnapshot, SessionMetadata, ProcessingOutput, DecisionOutput, BrainOutput, BrainConfig }