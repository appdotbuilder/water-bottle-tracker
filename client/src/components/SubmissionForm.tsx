import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { SubmitRestaurantInput, WaterBillingPolicy } from '../../../server/src/schema';

interface SubmissionFormProps {
  onSubmitted: () => void;
}

export function SubmissionForm({ onSubmitted }: SubmissionFormProps) {
  const [formData, setFormData] = useState<SubmitRestaurantInput>({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    water_billing_policy: 'free'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitStatus('idle');
    
    try {
      await trpc.submitRestaurant.mutate(formData);
      setSubmitStatus('success');
      // Reset form
      setFormData({
        name: '',
        address: '',
        latitude: 0,
        longitude: 0,
        water_billing_policy: 'free'
      });
      // Notify parent component
      setTimeout(() => {
        onSubmitted();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit restaurant:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit restaurant');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setIsGeoLoading(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        setFormData((prev: SubmitRestaurantInput) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setIsGeoLoading(false);
      },
      (error: GeolocationPositionError) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enter coordinates manually.');
        setIsGeoLoading(false);
      }
    );
  };

  if (submitStatus === 'success') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Thank you for your submission! 🎉
          </h3>
          <p className="text-green-700 mb-4">
            Your restaurant has been submitted for review. Our team will verify the information and publish it soon.
          </p>
          <p className="text-sm text-green-600">
            Redirecting to map view...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Restaurant Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Restaurant Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: SubmitRestaurantInput) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g., Tony's Italian Bistro"
          required
        />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: SubmitRestaurantInput) => ({ ...prev, address: e.target.value }))
          }
          placeholder="e.g., 123 Main St, City, State, ZIP"
          required
        />
      </div>

      {/* Coordinates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Location Coordinates *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGeoLoading}
            className="text-xs"
          >
            <MapPin className="w-3 h-3 mr-1" />
            {isGeoLoading ? 'Getting location...' : 'Use my location'}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude" className="text-sm text-gray-600">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: SubmitRestaurantInput) => ({ 
                  ...prev, 
                  latitude: parseFloat(e.target.value) || 0 
                }))
              }
              placeholder="e.g., 40.7128"
              required
            />
          </div>
          <div>
            <Label htmlFor="longitude" className="text-sm text-gray-600">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: SubmitRestaurantInput) => ({ 
                  ...prev, 
                  longitude: parseFloat(e.target.value) || 0 
                }))
              }
              placeholder="e.g., -74.0060"
              required
            />
          </div>
        </div>
      </div>

      {/* Water Billing Policy */}
      <div className="space-y-3">
        <Label>Water Billing Policy *</Label>
        <RadioGroup
          value={formData.water_billing_policy}
          onValueChange={(value: WaterBillingPolicy) =>
            setFormData((prev: SubmitRestaurantInput) => ({ ...prev, water_billing_policy: value }))
          }
        >
          <div className="flex items-center space-x-2 p-3 rounded-lg border border-green-200 bg-green-50">
            <RadioGroupItem value="free" id="free" />
            <Label htmlFor="free" className="flex-1 cursor-pointer">
              <span className="font-medium text-green-800">💧 Free Water</span>
              <p className="text-sm text-green-600">Restaurant provides free water to customers</p>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 rounded-lg border border-red-200 bg-red-50">
            <RadioGroupItem value="paid" id="paid" />
            <Label htmlFor="paid" className="flex-1 cursor-pointer">
              <span className="font-medium text-red-800">💰 Paid Water</span>
              <p className="text-sm text-red-600">Restaurant charges for water bottles/glasses</p>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Error Alert */}
      {submitStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={isLoading} 
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Submitting...' : 'Submit Restaurant'}
      </Button>

      {/* Info Note */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All submissions are reviewed by our team before being published. 
          We verify the information to ensure accuracy for our community. Thank you for contributing! 🙏
        </p>
      </div>
    </form>
  );
}