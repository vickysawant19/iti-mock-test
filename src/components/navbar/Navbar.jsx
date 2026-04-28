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
import logo from "@/assets/itimitra-logo.png"

// Import services and store actions
import authService from "@/services/auth.service";
import {
  removeUser,
  selectUser,
  selectUserLoading,
} from "@/store/userSlice";
import { removeProfile, selectProfile, addProfile } from "@/store/profileSlice";
import { setActiveBatch } from "@/store/activeBatchSlice";
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

  const { activeBatchId, userBatches } = useSelector((state) => state.activeBatch);
  
  // A student is batch-enrolled only if they have an approved batch Request.
  // Teachers and admins always count as enrolled.
  const isStudentEnrolled = !isStudent || userBatches?.length > 0;
  const hasNoBatches = !userBatches || userBatches.length === 0;

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
    if (!batchId || batchId === activeBatchId) return;
    dispatch(setActiveBatch({ batchId, userId: user.$id, isTeacher, currentBatches: userBatches }));
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
          className="w-full justify-between font-semibold text-sm hover:bg-primary/5 transition-colors rounded-xl"
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
      <CollapsibleContent className="ml-6 space-y-0.5 pt-1 border-l-2 border-primary/10 pl-2">
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
          `flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-all duration-200 ${
            isActive
              ? "bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-primary font-semibold shadow-sm"
              : "hover:bg-muted/60 hover:translate-x-0.5"
          } ${isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}`
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
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50/60 to-purple-50/60 dark:from-pink-950/20 dark:to-purple-950/20 rounded-2xl border border-pink-100/50 dark:border-pink-900/30">
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
            className="h-11 w-11 shrink-0 ring-2 ring-pink-200/50 dark:ring-pink-800/30 rounded-xl"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile?.userName || "User"}</p>
            <NavLink
              to="/profile"
              className="text-xs text-pink-600 dark:text-pink-400 hover:underline font-semibold"
              onClick={() => setIsNavOpen(false)}
            >
              View Profile
            </NavLink>
          </div>
        </div>

        {/* Batch Switcher for Teachers & Students */}
        {isTeacher && userBatches?.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Active Batch
            </span>
            <Select value={activeBatchId || ""} onValueChange={handleBatchSwitch}>
              <SelectTrigger className="w-full h-9 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border-slate-200/50 dark:border-slate-700 backdrop-blur-sm font-medium">
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                {userBatches.map((b) => {
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
        
        {isStudent && userBatches?.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Active Batch
            </span>
            <Select value={activeBatchId || ""} onValueChange={handleBatchSwitch}>
              <SelectTrigger className="w-full h-9 text-xs rounded-xl bg-white/70 dark:bg-slate-900/70 border-slate-200/50 dark:border-slate-700 backdrop-blur-sm font-medium">
                <SelectValue placeholder="Select a batch" />
              </SelectTrigger>
              <SelectContent>
                {userBatches.map((b) => (
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
    <div className="flex flex-col h-full bg-white/90 dark:bg-slate-950/95 backdrop-blur-2xl">
      {/* Sidebar Gradient Banner */}
      <div className="h-16 bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
      </div>
      <div className="-mt-5 px-4 pb-3">
        <div className="flex items-center gap-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl px-3 py-2.5 shadow-sm border border-white/40 dark:border-slate-800">
          <img src={logo} alt="ITI" className="h-[46px] w-[46px] object-contain" />
          <div>
            <SheetTitle className="text-sm font-extrabold tracking-tight">{currentHeading || "Navigation"}</SheetTitle>
            <SheetDescription className="sr-only">
              Navigation menu for the application
            </SheetDescription>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-slate-200/30 dark:border-slate-800/50">{renderUserProfile()}</div>

      <ScrollArea className="flex-1 px-3 py-3 h-full overflow-y-auto">
        <div className="space-y-0.5">
        {menuConfig.map((configItem, index) => {
          if (configItem.roles && !hasRole(configItem.roles)) return null;
          if (configItem.requiresAuth && !user) return null;
          // Hide batch-required sections for unenrolled students
          if (configItem.requiresBatch && !isStudentEnrolled) return null;

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
                  if (child.requiresBatch && !isStudentEnrolled) return null;
                  if (child.hideIfNoBatch && hasNoBatches) return null;
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
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200/50 dark:border-slate-800 p-4 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 rounded-xl hover:bg-primary/5 transition-colors"
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
            className="w-full justify-start gap-2 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400 rounded-xl transition-colors"
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
              className="w-full justify-start gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-sm transition-all"
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
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all ring-2 ring-transparent hover:ring-pink-200 dark:hover:ring-pink-900/50">
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.profileImage} />
                <AvatarFallback className="bg-gradient-to-tr from-pink-600 to-purple-600 text-white font-medium text-xs">
                  {profile?.userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xl p-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl mt-1">
            <div className="flex items-center justify-start gap-3 p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-500/20 dark:to-purple-500/20 rounded-xl mb-2 border border-pink-100/50 dark:border-pink-900/30">
              <Avatar className="h-12 w-12 ring-2 ring-pink-500/30 dark:ring-pink-500/50 shadow-sm">
                <AvatarImage src={profile?.profileImage} />
                <AvatarFallback className="bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold shadow-inner">
                  {profile?.userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 overflow-hidden">
                {profile?.userName ? (
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate" title={profile.userName}>{profile.userName}</p>
                ) : (
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">User</p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize truncate">
                  {isTeacher ? "Teacher" : isAdmin ? "Admin" : "Student"}
                </p>
              </div>
            </div>
            
            <DropdownMenuItem asChild>
              <NavLink
                to="/profile"
                className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors duration-200 group"
              >
                <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">My Profile</span>
              </NavLink>
            </DropdownMenuItem>
            
            <div className="px-2 my-1">
              <div className="h-px bg-slate-200/50 dark:bg-slate-800 w-full" />
            </div>
            
            <DropdownMenuItem
              className="flex items-center gap-3 cursor-pointer p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-200 group text-red-600 dark:text-red-400"
              onClick={handleLogout}
              disabled={isLogoutLoading}
            >
              <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                {isLogoutLoading ? (
                  <div className="h-4 w-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </div>
              <span className="font-semibold text-sm">{isLogoutLoading ? "Signing Out..." : "Sign Out"}</span>
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
        <Button size="sm" asChild disabled={isLoading} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-semibold shadow-sm transition-all">
          <NavLink to="/signup">SignUp</NavLink>
        </Button>
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl shadow-sm transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 relative">
        <div className="flex items-center gap-3 md:gap-5">
          {/* Mobile Menu Trigger */}
          <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl">
                <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>

            {/* Desktop Menu Trigger - Gmail style always visible sidebar button */}
            <SheetTrigger asChild className="hidden md:flex">
              <Button variant="ghost" size="icon" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-xl h-9 w-9 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800">
                <Menu className="h-[18px] w-[18px] text-slate-700 dark:text-slate-300" />
              </Button>
            </SheetTrigger>

            {/* Navigation content - same for both mobile and desktop */}
            <SheetContent
              side="left"
              className="p-0 w-72 border-l border-slate-200/50 dark:border-slate-800 shadow-2xl"
              onInteractOutside={() => setIsNavOpen(false)}
            >
              {renderNavContent()}
            </SheetContent>
          </Sheet>

          {/* Logo and App Title */}
          <NavLink to="/" className="flex items-center gap-3 ml-1 md:ml-0 group transition-all duration-200 hover:opacity-90">
            <img src={logo} alt="ITI" className="h-[52px] w-[52px] object-contain transform group-hover:scale-105 transition-transform duration-200" />
            {isLoading ? (
              <Skeleton className="h-5 w-32 hidden sm:block rounded-md" />
            ) : (
              <span className="font-extrabold text-[15px] hidden sm:block bg-gradient-to-br from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
                {currentHeading || "ITI Dashboard"}
              </span>
            )}
          </NavLink>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Theme Toggle Button */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-9 w-9 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
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
                className="relative rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors h-9 w-9 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {notifCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none animate-in zoom-in-75 duration-200 shadow-sm border border-white dark:border-slate-900">
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
