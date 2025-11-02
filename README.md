# Medicine Tracker App - Notification Service

A comprehensive React Native Expo app for tracking medications with intelligent push notifications.

## Features

### 🔔 Smart Notifications
- **Scheduled Reminders**: Set up multiple daily reminders for each medication
- **Interactive Notifications**: Mark doses as taken or snooze directly from notifications
- **Flexible Scheduling**: Choose specific days and times for each reminder
- **Background Processing**: Notifications work even when the app is closed

### 💊 Medication Management
- **Comprehensive Tracking**: Add medications with dosage, frequency, and notes
- **Adherence Monitoring**: Track medication adherence with visual progress indicators
- **Quick Actions**: Mark doses as taken with a single tap
- **Smart Insights**: View medication history and adherence statistics

### 📱 Cross-Platform Support
- **iOS & Android**: Native notification support with platform-specific features
- **Web Compatibility**: Graceful fallback for web platforms
- **Offline Capable**: Works without internet connection

## Notification Features

### Interactive Actions
- **✅ Mark as Taken**: Instantly record dose completion
- **⏰ Snooze**: Delay reminder by 15 minutes
- **📊 Adherence Tracking**: Automatic adherence calculation based on timing

### Smart Scheduling
- **Multiple Times**: Set different reminder times for the same medication
- **Day Selection**: Choose specific days of the week
- **Flexible Frequency**: Daily, weekly, or custom schedules
- **Time Zones**: Automatic handling of time zone changes

### Permission Management
- **Graceful Prompts**: User-friendly permission requests
- **Settings Integration**: Direct links to device notification settings
- **Fallback Options**: Alternative reminder methods when notifications are disabled

## Technical Implementation

### Core Services
- **NotificationService**: Centralized notification management
- **AsyncStorage**: Local data persistence
- **Expo Notifications**: Cross-platform notification API

### Key Components
- **NotificationSetup**: Comprehensive reminder configuration
- **NotificationPermissionPrompt**: User-friendly permission requests
- **useNotifications**: React hook for notification state management

### Data Flow
1. User creates medication and sets up reminders
2. NotificationService schedules platform-specific notifications
3. System delivers notifications at scheduled times
4. User interacts with notification (taken/snooze)
5. App updates medication records and adherence tracking

## Setup Instructions

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator (for testing)

### Installation
```bash
npm install
npx expo start
```

### Testing Notifications
1. Use physical device for full notification testing
2. Enable notifications when prompted
3. Use "Send Test Notification" button to verify setup
4. Test interactive actions (taken/snooze)

### Platform-Specific Setup

#### iOS
- Notifications work automatically on physical devices
- Simulator has limited notification support
- Background app refresh should be enabled

#### Android
- Notifications require explicit user permission
- Battery optimization may affect delivery
- Test on various Android versions for compatibility

#### Web
- Limited notification support
- Requires HTTPS for notification API
- Fallback to browser notifications

## Usage Guide

### Setting Up Medication Reminders
1. Add a medication in the Medicine tab
2. Tap the settings icon next to the medication
3. Configure reminder times and days
4. Enable notifications when prompted
5. Test with "Send Test Notification"

### Managing Notifications
- **Enable/Disable**: Toggle reminders on/off
- **Multiple Times**: Add multiple daily reminders
- **Day Selection**: Choose specific days of the week
- **Time Customization**: Set exact reminder times

### Responding to Notifications
- **Tap Notification**: Opens app to medication details
- **Mark as Taken**: Records dose and updates adherence
- **Snooze**: Delays reminder by 15 minutes
- **Ignore**: Notification will disappear after timeout

## Troubleshooting

### Notifications Not Working
1. Check device notification permissions
2. Verify app is not in battery optimization
3. Ensure background app refresh is enabled
4. Test with "Send Test Notification"

### Permission Issues
1. Go to device Settings > Notifications
2. Find the app and enable notifications
3. Allow critical alerts and badges
4. Restart the app after changing permissions

### Timing Issues
1. Check device time zone settings
2. Verify scheduled times in app
3. Test with immediate notifications first
4. Check for daylight saving time effects

## Development Notes

### Architecture Decisions
- **Singleton Pattern**: NotificationService uses singleton for global access
- **React Hooks**: Custom hooks for notification state management
- **AsyncStorage**: Local persistence for offline capability
- **Platform Detection**: Graceful handling of platform differences

### Performance Considerations
- **Lazy Loading**: Notifications initialized only when needed
- **Efficient Scheduling**: Batch notification operations
- **Memory Management**: Proper cleanup of notification listeners
- **Background Processing**: Minimal background activity

### Security & Privacy
- **Local Storage**: All data stored locally on device
- **No External APIs**: No medication data sent to external servers
- **Permission Respect**: Graceful handling of denied permissions
- **Data Encryption**: AsyncStorage provides basic encryption

## Future Enhancements

### Planned Features
- **Smart Scheduling**: AI-powered optimal reminder times
- **Health Integration**: Connect with Apple Health/Google Fit
- **Pharmacy Integration**: Automatic refill reminders
- **Family Sharing**: Caregiver notification support

### Technical Improvements
- **Push Notifications**: Server-side push notification support
- **Advanced Analytics**: Detailed adherence insights
- **Backup & Sync**: Cloud backup for medication data
- **Accessibility**: Enhanced screen reader support

## Contributing

### Development Setup
1. Fork the repository
2. Install dependencies: `npm install`
3. Start development server: `npx expo start`
4. Make changes and test thoroughly
5. Submit pull request with detailed description

### Testing Guidelines
- Test on both iOS and Android
- Verify notification permissions flow
- Test interactive notification actions
- Validate offline functionality
- Check accessibility features

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Comprehensive error handling
- Detailed logging for debugging
