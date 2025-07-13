import { Sensor, SensorEvent, Nudge, Chore, ChoreCompletion } from '@/types/harmony';
import { createNudge, recordSensorEvent, completeChore, getSensors, getChores } from './harmonyService';

// Sensor event patterns and their corresponding nudges
const SENSOR_NUDGE_PATTERNS = {
  motion: {
    kitchen: {
      morning: {
        title: 'Good morning! Time to start the day',
        message: 'The kitchen is active - perfect time to check today\'s chores!',
        type: 'chore_reminder' as const,
        priority: 'low' as const,
      },
      evening: {
        title: 'Evening kitchen activity detected',
        message: 'Great time to clean up after dinner and prepare for tomorrow!',
        type: 'chore_reminder' as const,
        priority: 'medium' as const,
      },
    },
    living_room: {
      title: 'Living room activity detected',
      message: 'Remember to keep shared spaces tidy for everyone!',
      type: 'chore_reminder' as const,
      priority: 'low' as const,
    },
    bathroom: {
      title: 'Bathroom activity detected',
      message: 'Don\'t forget to restock supplies and keep it clean!',
      type: 'chore_reminder' as const,
      priority: 'medium' as const,
    },
  },
  door: {
    front: {
      title: 'Front door activity',
      message: 'Welcome home! Time to check if any chores need attention.',
      type: 'chore_reminder' as const,
      priority: 'low' as const,
    },
    trash: {
      title: 'Trash taken out! 🎉',
      message: 'Great job! You\'ve earned chore credit for taking out the trash.',
      type: 'sensor_triggered' as const,
      priority: 'medium' as const,
    },
  },
  trash: {
    emptied: {
      title: 'Trash bin emptied',
      message: 'Excellent! Taking out the trash helps keep our home clean and organized.',
      type: 'sensor_triggered' as const,
      priority: 'medium' as const,
    },
    full: {
      title: 'Trash bin is getting full',
      message: 'The trash bin is nearly full. Time to take it out!',
      type: 'chore_reminder' as const,
      priority: 'high' as const,
    },
  },
  dishwasher: {
    completed: {
      title: 'Dishwasher cycle completed',
      message: 'Dishes are clean! Time to unload and put them away.',
      type: 'chore_reminder' as const,
      priority: 'medium' as const,
    },
    started: {
      title: 'Dishwasher started',
      message: 'Great initiative! Dishes are being cleaned.',
      type: 'sensor_triggered' as const,
      priority: 'low' as const,
    },
  },
  washer: {
    completed: {
      title: 'Laundry cycle completed',
      message: 'Laundry is done! Don\'t forget to move it to the dryer or fold it.',
      type: 'chore_reminder' as const,
      priority: 'medium' as const,
    },
  },
  dryer: {
    completed: {
      title: 'Dryer cycle completed',
      message: 'Clothes are dry! Time to fold and put them away.',
      type: 'chore_reminder' as const,
      priority: 'medium' as const,
    },
  },
  temperature: {
    high: {
      title: 'Temperature is high',
      message: 'The temperature is elevated. Consider adjusting the thermostat or opening windows.',
      type: 'sensor_triggered' as const,
      priority: 'medium' as const,
    },
    low: {
      title: 'Temperature is low',
      message: 'The temperature is low. Consider adjusting the thermostat for comfort.',
      type: 'sensor_triggered' as const,
      priority: 'medium' as const,
    },
  },
  humidity: {
    high: {
      title: 'High humidity detected',
      message: 'Humidity levels are high. Consider using a dehumidifier or opening windows.',
      type: 'sensor_triggered' as const,
      priority: 'medium' as const,
    },
  },
};

// Chore completion patterns
const CHORE_COMPLETION_PATTERNS = {
  'Take out trash': {
    title: 'Trash duty completed! 🗑️',
    message: 'Great job keeping our home clean! You\'ve earned 10 points.',
    points: 10,
  },
  'Load dishwasher': {
    title: 'Dishwasher loaded! 🍽️',
    message: 'Nice work! Dishes are being cleaned automatically. You\'ve earned 15 points.',
    points: 15,
  },
  'Unload dishwasher': {
    title: 'Dishes put away! 🏠',
    message: 'Excellent! Everything is organized and ready for the next meal. You\'ve earned 15 points.',
    points: 15,
  },
  'Clean kitchen': {
    title: 'Kitchen cleaned! 🧽',
    message: 'The kitchen looks great! You\'ve earned 20 points.',
    points: 20,
  },
  'Vacuum living room': {
    title: 'Living room vacuumed! 🧹',
    message: 'The living room is spotless! You\'ve earned 25 points.',
    points: 25,
  },
  'Clean bathroom': {
    title: 'Bathroom cleaned! 🚿',
    message: 'The bathroom is fresh and clean! You\'ve earned 30 points.',
    points: 30,
  },
  'Do laundry': {
    title: 'Laundry completed! 👕',
    message: 'All clothes are clean and put away! You\'ve earned 35 points.',
    points: 35,
  },
};

// Time-based patterns
const TIME_PATTERNS = {
  morning: {
    start: 6, // 6 AM
    end: 10, // 10 AM
    nudges: [
      {
        title: 'Good morning! ☀️',
        message: 'Start your day right by checking today\'s chores and responsibilities.',
        type: 'chore_reminder' as const,
        priority: 'low' as const,
      },
    ],
  },
  evening: {
    start: 18, // 6 PM
    end: 22, // 10 PM
    nudges: [
      {
        title: 'Evening wrap-up 🌙',
        message: 'Time to check if all daily chores are completed and prepare for tomorrow.',
        type: 'chore_reminder' as const,
        priority: 'medium' as const,
      },
    ],
  },
  weekend: {
    title: 'Weekend household check 📋',
    message: 'Weekends are perfect for tackling bigger chores and organizing shared spaces.',
    type: 'chore_reminder' as const,
    priority: 'medium' as const,
  },
};

export class SensorNudgeService {
  private static instance: SensorNudgeService;
  private activeSensors: Map<string, Sensor> = new Map();
  private eventHistory: Map<string, SensorEvent[]> = new Map();

  static getInstance(): SensorNudgeService {
    if (!SensorNudgeService.instance) {
      SensorNudgeService.instance = new SensorNudgeService();
    }
    return SensorNudgeService.instance;
  }

  // Initialize sensors for a household
  async initializeSensors(householdId: string): Promise<void> {
    const sensors = await getSensors(householdId);
    sensors.forEach(sensor => {
      this.activeSensors.set(sensor.id, sensor);
      this.eventHistory.set(sensor.id, []);
    });
  }

  // Process a sensor event and potentially create nudges
  async processSensorEvent(
    householdId: string,
    sensorId: string,
    eventType: SensorEvent['eventType'],
    value?: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // Record the event
    const eventId = await recordSensorEvent({
      sensorId,
      eventType,
      value,
      timestamp: new Date(),
      metadata,
    });

    // Get sensor details
    const sensor = this.activeSensors.get(sensorId);
    if (!sensor) return;

    // Add to event history
    const events = this.eventHistory.get(sensorId) || [];
    events.push({
      id: eventId,
      sensorId,
      eventType,
      value,
      timestamp: new Date(),
      metadata,
    });
    this.eventHistory.set(sensorId, events.slice(-10)); // Keep last 10 events

    // Check for nudge patterns
    await this.checkNudgePatterns(householdId, sensor, eventType, value, metadata);
  }

  // Check if sensor event matches any nudge patterns
  private async checkNudgePatterns(
    householdId: string,
    sensor: Sensor,
    eventType: SensorEvent['eventType'],
    value?: unknown,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const patterns = SENSOR_NUDGE_PATTERNS[sensor.type as keyof typeof SENSOR_NUDGE_PATTERNS];
    if (!patterns) return;

    let nudgePattern: any = null;

    // Check specific patterns based on sensor type and location
    if (sensor.type === 'motion') {
      const locationPatterns = patterns[sensor.location as keyof typeof patterns];
      if (locationPatterns) {
        const hour = new Date().getHours();
        if (hour >= 6 && hour <= 10) {
          nudgePattern = locationPatterns.morning || locationPatterns;
        } else if (hour >= 18 && hour <= 22) {
          nudgePattern = locationPatterns.evening || locationPatterns;
        } else {
          nudgePattern = locationPatterns;
        }
      }
    } else if (sensor.type === 'door') {
      nudgePattern = patterns[sensor.location as keyof typeof patterns];
    } else if (sensor.type === 'trash') {
      if (eventType === 'trash_emptied') {
        nudgePattern = patterns.emptied;
      } else if (value && value.level > 80) {
        nudgePattern = patterns.full;
      }
    } else if (sensor.type === 'dishwasher') {
      if (eventType === 'appliance_completed') {
        nudgePattern = patterns.completed;
      } else if (eventType === 'motion_detected') {
        nudgePattern = patterns.started;
      }
    } else if (sensor.type === 'washer' && eventType === 'appliance_completed') {
      nudgePattern = patterns.completed;
    } else if (sensor.type === 'dryer' && eventType === 'appliance_completed') {
      nudgePattern = patterns.completed;
    } else if (sensor.type === 'temperature') {
      if (value && value.temperature > 75) {
        nudgePattern = patterns.high;
      } else if (value && value.temperature < 65) {
        nudgePattern = patterns.low;
      }
    } else if (sensor.type === 'humidity' && value && value.humidity > 60) {
      nudgePattern = patterns.high;
    }

    // Create nudge if pattern matches
    if (nudgePattern) {
      await this.createNudge(householdId, {
        title: nudgePattern.title,
        message: nudgePattern.message,
        type: nudgePattern.type,
        priority: nudgePattern.priority,
        targetUsers: [], // Will be populated based on household members
      });
    }
  }

  // Create a nudge for the household
  private async createNudge(
    householdId: string,
    nudgeData: Omit<Nudge, 'id' | 'householdId' | 'isRead' | 'isDismissed' | 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    // Get household members (you'll need to implement this)
    const householdMembers = await this.getHouseholdMembers(householdId);
    
    const nudge: Omit<Nudge, 'id' | 'createdAt' | 'updatedAt'> = {
      householdId,
      title: nudgeData.title,
      message: nudgeData.message,
      type: nudgeData.type,
      priority: nudgeData.priority,
      targetUsers: householdMembers,
      isRead: false,
      isDismissed: false,
    };

    await createNudge(nudge);
  }

  // Process chore completion and create congratulatory nudges
  async processChoreCompletion(
    householdId: string,
    choreId: string,
    userId: string,
    choreTitle: string
  ): Promise<void> {
    const pattern = CHORE_COMPLETION_PATTERNS[choreTitle as keyof typeof CHORE_COMPLETION_PATTERNS];
    
    if (pattern) {
      await this.createNudge(householdId, {
        title: pattern.title,
        message: pattern.message,
        type: 'chore_completed',
        priority: 'medium',
        targetUsers: [userId],
      });
    }
  }

  // Check for time-based nudges
  async checkTimeBasedNudges(householdId: string): Promise<void> {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Morning nudges
    if (hour >= TIME_PATTERNS.morning.start && hour <= TIME_PATTERNS.morning.end) {
      for (const nudge of TIME_PATTERNS.morning.nudges) {
        await this.createNudge(householdId, {
          ...nudge,
          targetUsers: await this.getHouseholdMembers(householdId),
        });
      }
    }

    // Evening nudges
    if (hour >= TIME_PATTERNS.evening.start && hour <= TIME_PATTERNS.evening.end) {
      for (const nudge of TIME_PATTERNS.evening.nudges) {
        await this.createNudge(householdId, {
          ...nudge,
          targetUsers: await this.getHouseholdMembers(householdId),
        });
      }
    }

    // Weekend nudges (once per day)
    if (isWeekend && hour === 10) { // 10 AM on weekends
      await this.createNudge(householdId, {
        ...TIME_PATTERNS.weekend,
        targetUsers: await this.getHouseholdMembers(householdId),
      });
    }
  }

  // Get household members (placeholder - implement based on your user system)
  private async getHouseholdMembers(householdId: string): Promise<string[]> {
    // This should fetch actual household members from your database
    // For now, return a placeholder
    return ['user1', 'user2', 'user3']; // Replace with actual user IDs
  }

  // Analyze sensor patterns for insights
  async analyzeSensorPatterns(householdId: string): Promise<{
    mostActiveTime: string;
    mostActiveArea: string;
    choreCompletionRate: number;
    suggestions: string[];
  }> {
    const allEvents: SensorEvent[] = [];
    
    // Collect all events from the last 7 days
    for (const events of this.eventHistory.values()) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentEvents = events.filter(event => event.timestamp >= weekAgo);
      allEvents.push(...recentEvents);
    }

    // Analyze patterns
    const hourCounts = new Array(24).fill(0);
    const areaCounts: Record<string, number> = {};
    
    allEvents.forEach(event => {
      const hour = event.timestamp.getHours();
      hourCounts[hour]++;
      
      const sensor = this.activeSensors.get(event.sensorId);
      if (sensor) {
        areaCounts[sensor.location] = (areaCounts[sensor.location] || 0) + 1;
      }
    });

    // Find most active time
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts));
    const mostActiveTime = `${mostActiveHour}:00`;

    // Find most active area
    const mostActiveArea = Object.entries(areaCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    // Calculate chore completion rate (placeholder)
    const choreCompletionRate = 0.75; // 75% completion rate

    // Generate suggestions based on patterns
    const suggestions: string[] = [];
    
    if (mostActiveHour >= 22 || mostActiveHour <= 6) {
      suggestions.push('Consider establishing quiet hours during late night/early morning periods');
    }
    
    if (areaCounts.kitchen > areaCounts.living_room * 2) {
      suggestions.push('The kitchen sees a lot of activity - consider setting up a meal prep schedule');
    }

    return {
      mostActiveTime,
      mostActiveArea,
      choreCompletionRate,
      suggestions,
    };
  }

  // Get sensor insights for dashboard
  async getSensorInsights(householdId: string): Promise<{
    totalEvents: number;
    activeSensors: number;
    recentActivity: string;
    efficiencyScore: number;
  }> {
    const allEvents: SensorEvent[] = [];
    for (const events of this.eventHistory.values()) {
      allEvents.push(...events);
    }

    const totalEvents = allEvents.length;
    const activeSensors = this.activeSensors.size;
    
    // Calculate recent activity (last 24 hours)
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    const recentEvents = allEvents.filter(event => event.timestamp >= dayAgo);
    const recentActivity = `${recentEvents.length} events in the last 24 hours`;

    // Calculate efficiency score based on chore completion vs. sensor events
    const efficiencyScore = Math.min(100, Math.max(0, 
      (recentEvents.length / 10) * 100 // Normalize to 0-100
    ));

    return {
      totalEvents,
      activeSensors,
      recentActivity,
      efficiencyScore,
    };
  }
}

// Export singleton instance
export const sensorNudgeService = SensorNudgeService.getInstance(); 