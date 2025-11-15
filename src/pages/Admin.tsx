import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Mail, MessageSquare, Users, CheckCircle, Clock, Loader2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FeedbackItem {
  id: string;
  email: string | null;
  message: string;
  status: string;
  created_at: string;
  user_id: string | null;
  user_email?: string; // Retrieved from auth.users for authenticated users
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to access admin panel");
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (roleError) {
        console.error('Error checking admin role:', roleError);
        toast.error("Access denied");
        navigate("/");
        return;
      }

      if (!roleData) {
        toast.error("You don't have admin access");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadData();
    } catch (error) {
      console.error('Admin access check failed:', error);
      toast.error("Failed to verify admin access");
      navigate("/");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;
      
      // For authenticated users, fetch email from auth.users
      const feedbackWithEmails = await Promise.all(
        (feedbackData || []).map(async (item) => {
          if (item.user_id) {
            // Fetch email from auth admin API
            const { data: { user }, error } = await supabase.auth.admin.getUserById(item.user_id);
            if (!error && user) {
              return { ...item, user_email: user.email };
            }
          }
          return item;
        })
      );
      
      setFeedback(feedbackWithEmails);

      // Load user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;
      setUserRoles(rolesData || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setFeedback(prev => 
        prev.map(item => item.id === id ? { ...item, status: newStatus } : item)
      );
      toast.success("Status updated");
    } catch (error) {
      console.error('Error updating feedback status:', error);
      toast.error("Failed to update status");
    }
  };

  if (isAdmin === null || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Header showDashboardLink={true} showHomeLink={true} showMyLettersLink={true} />
      
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage feedback submissions and user roles
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Feedback</p>
                  <p className="text-3xl font-bold text-foreground">{feedback.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Feedback</p>
                  <p className="text-3xl font-bold text-foreground">
                    {feedback.filter(f => f.status === 'new').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-amber-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admin Users</p>
                  <p className="text-3xl font-bold text-foreground">
                    {userRoles.filter(r => r.role === 'admin').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Feedback Submissions
            </CardTitle>
            <CardDescription>
              Review and manage user feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedback.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No feedback submissions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {item.user_email || item.email || <span className="text-muted-foreground italic">Anonymous</span>}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[300px] max-w-[600px]">
                          <div className="space-y-2">
                            <p className="whitespace-normal break-words text-sm leading-relaxed">
                              {item.message.length > 200 
                                ? `${item.message.slice(0, 200)}...` 
                                : item.message}
                            </p>
                            {item.message.length > 200 && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-xs gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View Full Message
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Full Feedback Message</DialogTitle>
                                    <DialogDescription>
                                      From: {item.user_email || item.email || 'Anonymous'} • {new Date(item.created_at).toLocaleString()}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="mt-4">
                                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                      {item.message}
                                    </p>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={item.status === 'new' ? 'default' : 'secondary'}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.status === 'new' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateFeedbackStatus(item.id, 'reviewed')}
                              className="gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Reviewed
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Roles Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Roles
            </CardTitle>
            <CardDescription>
              View assigned user roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userRoles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No user roles assigned
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-mono text-sm">
                          {role.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {role.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(role.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
