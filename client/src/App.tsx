import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Shield } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { RestaurantMap } from '@/components/RestaurantMap';
import { SubmissionForm } from '@/components/SubmissionForm';
import { AdminPanel } from '@/components/AdminPanel';
import type { ApprovedRestaurant } from '../../server/src/schema';

function App() {
  const [restaurants, setRestaurants] = useState<ApprovedRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('map');

  // Load approved restaurants for map display
  const loadRestaurants = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getApprovedRestaurants.query();
      setRestaurants(result);
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  const handleRestaurantSubmitted = () => {
    // Switch to map tab after successful submission
    setActiveTab('map');
    // Note: New submissions are pending approval, so no need to reload map data
  };

  const handleAdminLogin = (success: boolean) => {
    if (success) {
      setIsAdmin(true);
      setActiveTab('admin');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setActiveTab('map');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">💧 Water Policy Tracker</h1>
                <p className="text-gray-600 text-sm">Find restaurants that don't charge for water</p>
              </div>
            </div>
            {isAdmin && (
              <Button variant="outline" onClick={handleAdminLogout}>
                Logout Admin
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Map
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Submit
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          {/* Map Tab */}
          <TabsContent value="map">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Restaurant Map</h2>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Free Water</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Paid Water</span>
                  </div>
                </div>
              </div>
              <RestaurantMap restaurants={restaurants} isLoading={isLoading} />
            </div>
          </TabsContent>

          {/* Submit Tab */}
          <TabsContent value="submit">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Submit a Restaurant</h2>
              <p className="text-gray-600 mb-6">
                Help build our community database! Share information about restaurants and their water billing policies.
                All submissions are reviewed by our team before being published.
              </p>
              <SubmissionForm onSubmitted={handleRestaurantSubmitted} />
            </div>
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <AdminPanel 
                isAuthenticated={isAdmin}
                onLogin={handleAdminLogin}
                onRestaurantApproved={loadRestaurants}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Community-driven platform to track restaurant water policies 💧
            </p>
            <p className="text-xs mt-2">
              Help make dining more transparent for everyone
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;