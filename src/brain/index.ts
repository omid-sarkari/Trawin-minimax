// Brain Engine - Main Entry Point
export * from './types';
export * from './config';
export * from './input/aggregator';
export * from './processing/state-manager';
export * from './decision/decision-maker';
export * from './output/database-writer';
export * from './output/resume-updater';

import { EventAggregator } from './input/aggregator';
import { StateManager } from './processing/state-manager';
import { DecisionMaker } from './decision/decision-maker';
import { DatabaseWriter } from './output/database-writer';
import { ResumeUpdater } from './output/resume-updater';
import { BRAIN_CONFIG } from './config';
import { BrainEvent, BrainResult, BrainBatchResult } from './types';

// Main Brain Engine class
export class BrainEngine {
  private aggregator: EventAggregator;
  private stateManager: StateManager;
  private decisionMaker: DecisionMaker;
  private databaseWriter: DatabaseWriter;
  private resumeUpdater: ResumeUpdater;

  constructor() {
    this.aggregator = new EventAggregator();
    this.stateManager = new StateManager();
    this.decisionMaker = new DecisionMaker();
    this.databaseWriter = new DatabaseWriter();
    this.resumeUpdater = new ResumeUpdater();
  }

  // Main method to process a single event
  async process(sessionId: string, event: BrainEvent): Promise<BrainResult> {
    try {
      // Step 1: Aggregate the event
      const aggregatedEvent = await this.aggregator.aggregate(sessionId, event);
      
      if (aggregatedEvent.filtered) {
        return {
          success: true,
          sessionId,
          decision: { filtered: true, reason: aggregatedEvent.reason },
          updatedAt: new Date().toISOString()
        };
      }

      // Step 2: Update state
      const state = await this.stateManager.updateState(sessionId, aggregatedEvent);

      // Step 3: Make decision
      const decision = await this.decisionMaker.makeDecision(sessionId, state);

      // Step 4: Write to database
      await this.databaseWriter.writeToDatabase(sessionId, decision);

      // Step 5: Update resume
      await this.resumeUpdater.updateResume(sessionId, decision);

      return {
        success: true,
        sessionId,
        decision,
        updatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error in BrainEngine.process:', error);
      return {
        success: false,
        sessionId,
        decision: { error: error.message },
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Process multiple events in a batch
  async processBatch(events: BrainEvent[]): Promise<BrainBatchResult> {
    const results: BrainResult[] = [];
    
    for (const event of events) {
      try {
        const result = await this.process(event.sessionId, event);
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          sessionId: event.sessionId,
          decision: { error: error.message },
          updatedAt: new Date().toISOString()
        });
      }
    }

    return {
      success: true,
      processed: results.length,
      results
    };
  }

  // Get current state for a session
  async getState(sessionId: string): Promise<any> {
    return this.stateManager.getState(sessionId);
  }

  // Get decision history for a session
  async getDecisionHistory(sessionId: string, limit: number = 10): Promise<any[]> {
    return this.databaseWriter.getDecisionHistory(sessionId, limit);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
export const brainEngine = new BrainEngine();
