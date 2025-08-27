import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2 } from 'lucide-react';
import type { ApprovedRestaurant } from '../../../server/src/schema';

interface RestaurantMapProps {
  restaurants: ApprovedRestaurant[];
  isLoading: boolean;
}

export function RestaurantMap({ restaurants, isLoading }: RestaurantMapProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<ApprovedRestaurant | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No restaurants yet</h3>
          <p className="text-gray-500">Be the first to submit a restaurant!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Placeholder - In a real implementation, this would be integrated with a mapping library */}
      <div className="relative h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6 bg-white/90 rounded-lg shadow-sm">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-sm text-gray-600 mb-1">🗺️ Interactive Map</p>
            <p className="text-xs text-gray-500">
              Map integration would display restaurant locations here
            </p>
          </div>
        </div>
        
        {/* Simulated map markers */}
        {restaurants.map((restaurant: ApprovedRestaurant, index: number) => (
          <button
            key={restaurant.id}
            className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform ${
              restaurant.water_billing_policy === 'free' 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
            style={{
              top: `${20 + (index % 3) * 25}%`,
              left: `${20 + (index % 4) * 20}%`
            }}
            onClick={() => setSelectedRestaurant(restaurant)}
            title={`${restaurant.name} - ${restaurant.water_billing_policy === 'free' ? 'Free' : 'Paid'} water`}
          />
        ))}
      </div>

      {/* Selected Restaurant Info */}
      {selectedRestaurant && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{selectedRestaurant.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{selectedRestaurant.address}</p>
                <Badge 
                  variant={selectedRestaurant.water_billing_policy === 'free' ? 'default' : 'destructive'}
                  className={selectedRestaurant.water_billing_policy === 'free' ? 'bg-green-500' : ''}
                >
                  {selectedRestaurant.water_billing_policy === 'free' ? '💧 FREE WATER' : '💰 Paid Water'}
                </Badge>
              </div>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Restaurant List */}
      <div className="grid gap-3">
        <h3 className="font-medium text-gray-700">All Restaurants ({restaurants.length})</h3>
        {restaurants.map((restaurant: ApprovedRestaurant) => (
          <Card 
            key={restaurant.id} 
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedRestaurant?.id === restaurant.id ? 'ring-2 ring-blue-200' : ''
            }`}
            onClick={() => setSelectedRestaurant(restaurant)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{restaurant.name}</h4>
                  <p className="text-sm text-gray-600">{restaurant.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={restaurant.water_billing_policy === 'free' ? 'default' : 'destructive'}
                    className={restaurant.water_billing_policy === 'free' ? 'bg-green-500' : ''}
                  >
                    {restaurant.water_billing_policy === 'free' ? 'FREE' : 'PAID'}
                  </Badge>
                  <div className={`w-3 h-3 rounded-full ${
                    restaurant.water_billing_policy === 'free' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}