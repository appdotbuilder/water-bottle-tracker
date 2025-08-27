import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  AlertCircle,
  MapPin,
  Calendar
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  AdminLoginInput, 
  PendingRestaurant, 
  ReviewRestaurantInput 
} from '../../../server/src/schema';

interface AdminPanelProps {
  isAuthenticated: boolean;
  onLogin: (success: boolean) => void;
  onRestaurantApproved: () => void;
}

export function AdminPanel({ isAuthenticated, onLogin, onRestaurantApproved }: AdminPanelProps) {
  const [loginData, setLoginData] = useState<AdminLoginInput>({
    username: '',
    password: ''
  });
  const [pendingRestaurants, setPendingRestaurants] = useState<PendingRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});

  const loadPendingRestaurants = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getPendingRestaurants.query();
      setPendingRestaurants(result);
    } catch (error) {
      console.error('Failed to load pending restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadPendingRestaurants();
  }, [loadPendingRestaurants]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    
    try {
      const response = await trpc.adminLogin.mutate(loginData);
      if (response.success) {
        onLogin(true);
        setLoginData({ username: '', password: '' });
      } else {
        setLoginError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (restaurantId: number, action: 'approve' | 'reject') => {
    try {
      const reviewData: ReviewRestaurantInput = {
        id: restaurantId,
        action,
        reviewed_by: 'Admin', // In real app, this would come from the authenticated user
        notes: reviewNotes[restaurantId] || null
      };

      await trpc.reviewRestaurant.mutate(reviewData);
      
      // Remove from pending list
      setPendingRestaurants((prev: PendingRestaurant[]) => 
        prev.filter((restaurant: PendingRestaurant) => restaurant.id !== restaurantId)
      );
      
      // Clear notes for this restaurant
      setReviewNotes((prev: Record<number, string>) => {
        const updated = { ...prev };
        delete updated[restaurantId];
        return updated;
      });
      
      // If approved, notify parent to refresh approved restaurants
      if (action === 'approve') {
        onRestaurantApproved();
      }
    } catch (error) {
      console.error(`Failed to ${action} restaurant:`, error);
      alert(`Failed to ${action} restaurant. Please try again.`);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <Shield className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold">Admin Login</h2>
          <p className="text-gray-600">Access the administrative panel</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={loginData.username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLoginData((prev: AdminLoginInput) => ({ ...prev, username: e.target.value }))
              }
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={loginData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLoginData((prev: AdminLoginInput) => ({ ...prev, password: e.target.value }))
              }
              required
            />
          </div>
          
          {loginError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is using placeholder authentication. 
            In production, proper security measures would be implemented.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Admin Panel
          </h2>
          <p className="text-gray-600">Review and approve restaurant submissions</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Authenticated
        </Badge>
      </div>

      <Separator />

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading pending submissions...</p>
        </div>
      ) : pendingRestaurants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No pending submissions</h3>
          <p className="text-gray-500">All restaurant submissions have been reviewed!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-medium">
            Pending Submissions ({pendingRestaurants.length})
          </h3>
          
          {pendingRestaurants.map((restaurant: PendingRestaurant) => (
            <Card key={restaurant.id} className="border-l-4 border-l-yellow-400">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span>{restaurant.name}</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Address</Label>
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-400" />
                      {restaurant.address}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-600">Coordinates</Label>
                    <p className="text-sm font-mono">
                      {restaurant.latitude.toFixed(6)}, {restaurant.longitude.toFixed(6)}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-600">Water Policy</Label>
                    <Badge 
                      variant={restaurant.water_billing_policy === 'free' ? 'default' : 'destructive'}
                      className={restaurant.water_billing_policy === 'free' ? 'bg-green-500' : ''}
                    >
                      {restaurant.water_billing_policy === 'free' ? '💧 Free' : '💰 Paid'}
                    </Badge>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-600">Submitted</Label>
                    <p className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {restaurant.submitted_at.toLocaleDateString()} at{' '}
                      {restaurant.submitted_at.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {restaurant.notes && (
                  <div>
                    <Label className="text-sm text-gray-600">Submission Notes</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">{restaurant.notes}</p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor={`notes-${restaurant.id}`} className="text-sm text-gray-600">
                    Review Notes (Optional)
                  </Label>
                  <Textarea
                    id={`notes-${restaurant.id}`}
                    value={reviewNotes[restaurant.id] || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setReviewNotes((prev: Record<number, string>) => ({ 
                        ...prev, 
                        [restaurant.id]: e.target.value 
                      }))
                    }
                    placeholder="Add notes about this review..."
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReview(restaurant.id, 'approve')}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReview(restaurant.id, 'reject')}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}