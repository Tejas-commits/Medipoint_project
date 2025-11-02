import { Platform, Linking, Alert } from 'react-native';

export interface LocationData {
  address: string;
  name?: string;
  phone?: string;
}

export class MapsIntegration {
  /**
   * Opens Google Maps with the specified location
   * @param location - Location data including address and optional name/phone
   */
  static async openDirections(location: LocationData): Promise<void> {
    try {
      // Validate address
      if (!location.address || location.address.trim().length === 0) {
        Alert.alert(
          'Address Error',
          'No address available for this location. Please contact them directly.',
          [{ text: 'OK' }]
        );
        return;
      }

      const cleanAddress = location.address.trim();
      const encodedAddress = encodeURIComponent(cleanAddress);
      
      // Add location name if available for better search results
      const searchQuery = location.name 
        ? encodeURIComponent(`${location.name}, ${cleanAddress}`)
        : encodedAddress;

      await this.openMapsUrl(searchQuery, cleanAddress);
    } catch (error) {
      console.error('Error opening maps:', error);
      this.showErrorAlert(location.address);
    }
  }

  /**
   * Opens the appropriate maps URL based on platform
   */
  private static async openMapsUrl(searchQuery: string, fallbackAddress: string): Promise<void> {
    if (Platform.OS === 'web') {
      await this.openWebMaps(searchQuery, fallbackAddress);
    } else {
      await this.openMobileMaps(searchQuery, fallbackAddress);
    }
  }

  /**
   * Opens Google Maps in web browser
   */
  private static async openWebMaps(searchQuery: string, fallbackAddress: string): Promise<void> {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    
    try {
      // Try to open in new tab/window
      const newWindow = window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        // Popup was blocked
        this.showPopupBlockedAlert(fallbackAddress, mapsUrl);
      }
    } catch (error) {
      // Fallback to current window
      window.location.href = mapsUrl;
    }
  }

  /**
   * Opens Google Maps on mobile devices
   */
  private static async openMobileMaps(searchQuery: string, fallbackAddress: string): Promise<void> {
    // Primary: Google Maps web URL (works on most devices)
    const primaryUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
    
    // Fallback: Generic maps URL scheme
    const fallbackUrl = `maps:0,0?q=${searchQuery}`;
    
    // Alternative: Apple Maps for iOS
    const appleMapsUrl = `http://maps.apple.com/?q=${searchQuery}`;

    try {
      // Try primary URL first
      const primarySupported = await Linking.canOpenURL(primaryUrl);
      if (primarySupported) {
        await Linking.openURL(primaryUrl);
        return;
      }

      // Try fallback URL
      const fallbackSupported = await Linking.canOpenURL(fallbackUrl);
      if (fallbackSupported) {
        await Linking.openURL(fallbackUrl);
        return;
      }

      // Try Apple Maps on iOS
      if (Platform.OS === 'ios') {
        const appleMapsSupported = await Linking.canOpenURL(appleMapsUrl);
        if (appleMapsSupported) {
          await Linking.openURL(appleMapsUrl);
          return;
        }
      }

      // No maps app available
      this.showNoMapsAlert(fallbackAddress);
    } catch (error) {
      console.error('Error opening mobile maps:', error);
      this.showErrorAlert(fallbackAddress);
    }
  }

  /**
   * Shows alert when popup is blocked
   */
  private static showPopupBlockedAlert(address: string, mapsUrl: string): void {
    Alert.alert(
      'Open Maps',
      'Please allow popups to open Google Maps, or use one of the options below.',
      [
        { 
          text: 'Open in Current Tab', 
          onPress: () => window.location.href = mapsUrl 
        },
        { 
          text: 'Copy Address', 
          onPress: () => this.copyToClipboard(address) 
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }

  /**
   * Shows alert when no maps app is available
   */
  private static showNoMapsAlert(address: string): void {
    Alert.alert(
      'Maps Not Available',
      'Unable to open maps application. Please install Google Maps or use the address manually.',
      [
        { 
          text: 'Copy Address', 
          onPress: () => this.copyToClipboard(address) 
        },
        { text: 'OK' }
      ]
    );
  }

  /**
   * Shows generic error alert
   */
  private static showErrorAlert(address: string): void {
    Alert.alert(
      'Navigation Error',
      'Unable to open maps. Please try again or use the address manually.',
      [
        { 
          text: 'Copy Address', 
          onPress: () => this.copyToClipboard(address) 
        },
        { text: 'OK' }
      ]
    );
  }

  /**
   * Copies text to clipboard with platform-specific handling
   */
  private static copyToClipboard(text: string): void {
    if (Platform.OS === 'web') {
      // Web clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          Alert.alert('Copied', 'Address copied to clipboard');
        }).catch(() => {
          this.showManualCopyAlert(text);
        });
      } else {
        this.showManualCopyAlert(text);
      }
    } else {
      // For React Native, you would use @react-native-clipboard/clipboard
      // For now, show the address for manual copying
      this.showManualCopyAlert(text);
    }
  }

  /**
   * Shows alert with address for manual copying
   */
  private static showManualCopyAlert(text: string): void {
    Alert.alert(
      'Address',
      text,
      [{ text: 'OK' }],
      { cancelable: true }
    );
  }

  /**
   * Validates if an address appears to be complete
   */
  static validateAddress(address: string): boolean {
    if (!address || address.trim().length === 0) {
      return false;
    }

    const cleanAddress = address.trim();
    
    // Basic validation - should contain at least a number and some text
    const hasNumber = /\d/.test(cleanAddress);
    const hasText = /[a-zA-Z]/.test(cleanAddress);
    const minLength = cleanAddress.length >= 10;

    return hasNumber && hasText && minLength;
  }

  /**
   * Formats address for better display
   */
  static formatAddress(address: string): string {
    return address.trim().replace(/\s+/g, ' ');
  }
}