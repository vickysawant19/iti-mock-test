import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/ThemeProvider";

// Import Shadcn components
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

// Import icons
import { Menu, User, LogOut, ChevronRight, Sun, Moon, Bell } from "lucide-react";
import logo from "@/assets/iti-logo.jpg"

// Import services and store actions
import authService from "@/appwrite/auth";
import {
  removeUser,
  selectUser,
  selectUserLoading,
} from "@/store/userSlice";
import { removeProfile, selectProfile, addProfile } from "@/store/profileSlice";
import userProfileService from "@/appwrite/userProfileService";
import batchStudentService from "@/appwrite/batchStudentService";
import batchService from "@/appwrite/batchService";

import { menuConfig, pathToHeading } from "./navMenu";
import { Query } from "appwrite";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPanel from "@/components/notifications/NotificationPanel";

const Navbar = ({ isNavOpen, setIsNavOpen }) => {
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectUserLoading);

  const profile = useSelector(selectProfile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const [expandedGroup, setExpandedGroup] = useState("");
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { notifications, notifCount } = useNotifications();

  const isTeacher = user?.labels?.includes("Teacher");
  const isAdmin = user?.labels?.includes("admin");
  const isStudent = user && !isTeacher && !isAdmin;

  const [studentBatchesList, setStudentBatchesList] = useState([]);
  const [teacherBatchesList, setTeacherBatchesList] = useState([]);
  
  useEffect(() => {
    const fetchStudentBatches = async () => {
      if (isStudent && user?.$id) {
        try {
          const bsInfo = await batchStudentService.getStudentBatches(user.$id);
          if (bsInfo.length > 0) {
            const batchIds = bsInfo.map(b => b.batchId);
            // Fetch names for these batches
            const batches = await batchService.getBatchesByIds(batchIds);
            if (batches && batches.length > 0) {
               setStudentBatchesList(batches);
            }
          }
        } catch (e) {
          console.error("Error fetching student batches", e);
        }
      }
    };
    const fetchTeacherBatches = async () => {
      if (isTeacher && user?.$id) {
        try {
          const batches = await batchService.listBatches([Query.equal("teacherId", [user.$id])]);
          if (batches?.documents && batches.documents.length > 0) {
             setTeacherBatchesList(batches.documents);
          }
        } catch (e) {
          console.error("Error fetching teacher batches", e);
        }
      }
    };
    fetchStudentBatches();
    fetchTeacherBatches();
  }, [isStudent, isTeacher, user]);

  const currentHeading = pathToHeading[location.pathname] || "";

  const handleLogout = async () => {
    if (isLoading || !user) return;

    try {
      setIsLogoutLoading(true);
      await authService.logout();
      dispatch(removeUser());
      dispatch(removeProfile());

      // Only redirect when loading completes
      if (!isLoading) {
        navigate("/");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLogoutLoading(false);
    }
  };

  const toggleGroup = (group) => {
    setExpandedGroup(expandedGroup === group ? "" : group);
  };

  // Helper to check if the current user has one of the allowed roles
  const hasRole = (roles) => {
    if (!roles) return true;
    return roles.some((role) => {
      if (role === "teacher") return isTeacher;
      if (role === "admin") return isAdmin;
      if (role === "student") return isStudent;
      return false;
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleBatchSwitch = async (batchId) => {
    if (!batchId || batchId === profile?.batchId) return;
    try {
      const updatedProfile = await userProfileService.updateUserProfile(profile.$id, {
        batchId: batchId,
      });
      dispatch(addProfile({ data: updatedProfile }));
    } catch (error) {
      console.error("Error switching batch:", error);
    }
  };

  const MenuGroup = ({ title, icon: Icon, children, groupKey }) => (
    <Collapsible
      className="w-full my-1"
      open={expandedGroup === groupKey}
      onOpenChange={() => toggleGroup(groupKey)}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between font-medium text-sm"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span>{title}</span>
          </div>
          <ChevronRight
            className={`w-4 h-4 transition-transform ${
              expandedGroup === groupKey ? "rotate-90" : ""
            }`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-6 space-y-1 pt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  const MenuItem = ({ to, icon: Icon, children, onClick }) => {
    const handleMenuClick = (e) => {
      if (isLoading) {
        e.preventDefault();
        return;
      }
      onClick?.();
      setIsNavOpen(false);
    };

    return (
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-2 p-2 text-sm rounded-md transition-colors ${
            isActive
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted"
          } ${isLoading ? "pointer-events-none opacity-50" : ""}`
        }
        onClick={(e) => {
          e.preventDefault();
          handleMenuClick(e);
          setTimeout(() => navigate(to), 150);
        }}
      >
        <Icon className="w-4 h-4" />
        <span>{children}</span>
      </NavLink>
    );
  };

  // User Profile section with loading state
  const renderUserProfile = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      );
    }

    return user ? (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <InteractiveAvatar
            src={profile?.profileImage}
            fallbackText={profile?.userName?.charAt(0) || "U"}
            userId={profile?.userId || user?.$id}
            editable={true}
            onImageUpdate={async (newUrl) => {
               if (profile && profile.$id) {
                 const updated = { ...profile, profileImage: newUrl };
                 dispatch(addProfile({ data: updated }));
                 await userProfileService.patchUserProfile(profile.$id, { profileImage: newUrl });
               }
            }}
            className="h-10 w-10 shrink-0"
          />
          <div>
            <p className="text-sm font-medium">{profile?.userName || "User"}</p>
            <NavLink
              to="/profile"
              className="text-xs text-primary hover:underline"
              onClick={() => setIsNavOpen(false)}
            >
              View Profile
            </NavLink>
          </div>
        </div>

        {/* Batch Switcher for Teachers & Students */}
        {isTeacher && teacherBatchesList.length > 0 && (
          <div className="space-y-1.5 mt-2 pt-2 border-t dark:border-slate-800">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Batch
            </span>
            <Select value={profile?.batchId || ""} onValueChange={handleBatchSwitch}>
              <SelectTrigger className="w-full h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                {teacherBatchesList.map((b) => {
                  if (!b?.$id) return null;
                  return (
                    <SelectItem key={b.$id} value={b.$id}>
                      {b.BatchName || "Unknown Batch"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {isStudent && studentBatchesList.length > 0 && (
          <div className="space-y-1.5 mt-2 pt-2 border-t dark:border-slate-800">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Batch
            </span>
            <Select value={profile?.batchId || ""} onValueChange={handleBatchSwitch}>
              <SelectTrigger className="w-full h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                {studentBatchesList.map((b) => (
                  <SelectItem key={b.$id} value={b.$id}>
                    {b.BatchName || b.$id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    ) : (
      <div className="text-sm text-muted-foreground">Not logged in</div>
    );
  };

  const renderNavContent = () => (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="flex items-center gap-2">
          <img src={logo} alt="ITI" className="h-6 w-6 rounded-md" />
          <SheetTitle>{currentHeading || "Navigation"}</SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu for the application
          </SheetDescription>
        </div>
      </div>

      <div className="p-4 border-b">{renderUserProfile()}</div>

      <ScrollArea className="flex-1 px-2 py-4 h-full overflow-y-auto">
        {menuConfig.map((configItem, index) => {
          if (configItem.roles && !hasRole(configItem.roles)) return null;
          if (configItem.requiresAuth && !user) return null;

          if (configItem.group) {
            return (
              <MenuGroup
                key={index}
                title={configItem.group}
                groupKey={configItem.groupKey}
                icon={configItem.icon}
              >
                {configItem.children.map((child, idx) => {
                  if (child.requiresAuth && !user) return null;
                  if (child.roles && !hasRole(child.roles)) return null;
                  let label = child.label;
                  if (child.teacherLabel && child.studentLabel) {
                    label = isTeacher ? child.teacherLabel : child.studentLabel;
                  }
                  return (
                    <MenuItem key={idx} to={child.path} icon={child.icon}>
                      {label}
                    </MenuItem>
                  );
                })}
              </MenuGroup>
            );
          } else if (configItem.items) {
            return configItem.items.map((child, idx) => {
              if (child.requiresAuth && !user) return null;
              if (child.roles && !hasRole(child.roles)) return null;
              let label = child.label;
              if (child.teacherLabel && child.studentLabel) {
                label = isTeacher ? child.teacherLabel : child.studentLabel;
              }
              return (
                <MenuItem key={idx} to={child.path} icon={child.icon}>
                  {label}
                </MenuItem>
              );
            });
          }
          return null;
        })}
      </ScrollArea>

      <div className="border-t p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>

        {isLoading ? (
          <div className="mt-2">
            <Skeleton className="h-9 w-full" />
          </div>
        ) : user ? (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 mt-2 text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (!isLoading) {
                handleLogout();
                setIsNavOpen(false);
              }
            }}
            disabled={isLogoutLoading || isLoading}
          >
            {isLogoutLoading ? (
              <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {isLogoutLoading ? "Logging out..." : "Logout"}
          </Button>
        ) : (
          <div className="mt-2 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => {
                if (!isLoading) {
                  setIsNavOpen(false);
                  setTimeout(() => navigate("/login"), 150);
                }
              }}
              disabled={isLoading}
            >
              <User className="h-4 w-4" />
              Login
            </Button>
            <Button
              variant="default"
              size="sm"
              className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                if (!isLoading) {
                  setIsNavOpen(false);
                  setTimeout(() => navigate("/signup"), 150);
                }
              }}
              disabled={isLoading}
            >
              <User className="h-4 w-4" />
              SignUp
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // User menu dropdown in header with loading state
  const renderUserMenu = () => {
    // if (isLoading) {
    //   return (
    //     <div className="flex items-center gap-2">
    //       <Skeleton className="h-8 w-8 rounded-full" />
    //     </div>
    //   );
    // }

    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.profileImage} />
                <AvatarFallback>
                  {profile?.userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {profile?.userName && (
                  <p className="font-medium">{profile.userName}</p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink
                to="/profile"
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
              disabled={isLogoutLoading}
            >
              {isLogoutLoading ? (
                <div className="h-4 w-4 mr-2 border-2 border-current border-r-transparent rounded-full animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              <span>{isLogoutLoading ? "Logging out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild disabled={isLoading} className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
          <NavLink to="/login">Login</NavLink>
        </Button>
        <Button size="sm" asChild disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          <NavLink to="/signup">SignUp</NavLink>
        </Button>
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Menu Trigger */}
          <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>

            {/* Desktop Menu Trigger - Gmail style always visible sidebar button */}
            <SheetTrigger asChild className="hidden md:flex">
              <Button variant="ghost" size="sm" className="gap-2">
                <Menu className="h-4 w-4" />
                {/* <span>Menu</span> */}
              </Button>
            </SheetTrigger>

            {/* Navigation content - same for both mobile and desktop */}
            <SheetContent
              side="left"
              className="p-0 w-72"
              onInteractOutside={() => setIsNavOpen(false)}
            >
              {renderNavContent()}
            </SheetContent>
          </Sheet>

          {/* Logo and App Title */}
          <NavLink to="/" className="flex items-center gap-2">
            <img src={logo} alt="ITI" className="h-6 w-6 rounded-md" />
            {isLoading ? (
              <Skeleton className="h-4 w-32 hidden sm:block" />
            ) : (
              <span className="font-medium text-sm hidden sm:block">
                {currentHeading || "ITI Dashboard"}
              </span>
            )}
          </NavLink>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notification Bell */}
          {user && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsNotifOpen((o) => !o)}
                className="relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none animate-in zoom-in-75 duration-200">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Button>
              <NotificationPanel
                notifications={notifications}
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
              />
            </div>
          )}

          {/* User Menu */}
          {renderUserMenu()}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
