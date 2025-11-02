import { MapsIntegration } from '../mapsIntegration';

describe('MapsIntegration', () => {
  describe('validateAddress', () => {
    it('should return true for valid addresses', () => {
      const validAddresses = [
        '123 Main St, City, State 12345',
        '456 Healthcare Blvd, Suite 200, City, ST 54321',
        '789 Medical Center Dr, City, State',
        '1000 Hospital Way, Building A, City, State 12345'
      ];

      validAddresses.forEach(address => {
        expect(MapsIntegration.validateAddress(address)).toBe(true);
      });
    });

    it('should return false for invalid addresses', () => {
      const invalidAddresses = [
        '',
        '   ',
        'Main St', // Too short, no number
        '123', // No street name
        'Street Name', // No number
        'N/A',
        'TBD'
      ];

      invalidAddresses.forEach(address => {
        expect(MapsIntegration.validateAddress(address)).toBe(false);
      });
    });
  });

  describe('formatAddress', () => {
    it('should clean up address formatting', () => {
      expect(MapsIntegration.formatAddress('  123   Main   St  ')).toBe('123 Main St');
      expect(MapsIntegration.formatAddress('456\nHealthcare\tBlvd')).toBe('456 Healthcare Blvd');
    });

    it('should handle empty addresses', () => {
      expect(MapsIntegration.formatAddress('')).toBe('');
      expect(MapsIntegration.formatAddress('   ')).toBe('');
    });
  });
});

// Mock data for testing
export const mockProviders = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'General Practitioner',
    address: '123 Medical Center Dr, City, State 12345',
    phone: '(555) 123-4567',
    rating: 4.8,
    distance: 0.5,
    hours: '9:00 AM - 5:00 PM',
    available: true,
  },
  {
    id: '2',
    name: 'City Pharmacy',
    specialty: 'Pharmacy',
    address: 'Main St', // Invalid address for testing
    phone: '(555) 234-5678',
    rating: 4.6,
    distance: 0.8,
    hours: '8:00 AM - 10:00 PM',
    available: true,
  },
  {
    id: '3',
    name: 'International Clinic',
    specialty: 'General Medicine',
    address: '456 Rue de la Santé, 75014 Paris, France',
    phone: '+33 1 23 45 67 89',
    rating: 4.7,
    distance: 2.3,
    hours: '8:00 AM - 6:00 PM',
    available: true,
  }
];