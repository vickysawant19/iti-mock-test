/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

// Import icons
import { Menu, User, LogOut, Sun, Moon, Bell, GraduationCap, ChevronDown } from "lucide-react";
import logo from "@/assets/itimitra-logo.webp";

// Import services and store actions
import authService from "@/services/auth/auth.service";
import {
  removeUser,
  selectUser,
  selectUserLoading,
} from "@/store/userSlice";
import { removeProfile, selectProfile, addProfile } from "@/store/profileSlice";
import { setActiveBatch, clearActiveBatch } from "@/store/activeBatchSlice";
import userProfileService from "@/services/auth/userProfileService";

import { menuConfig, pathToHeading } from "./navMenu";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import OnlineIndicator from "@/components/components/OnlineIndicator";
import { fixProfileImage } from "@/services/core/appwriteClient";

const matchesRoutePattern = (pattern, pathname) => {
  if (pattern === "/") return pathname === "/";

  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  return patternParts.length <= pathParts.length && patternParts.every((part, index) =>
    part.startsWith(":") || part === pathParts[index]
  );
};

const Navbar = ({ isNavOpen, setIsNavOpen }) => {
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectUserLoading);

  const profile = useSelector(selectProfile);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState("");

  const { notifications, notifCount } = useNotifications();

  const isTeacher = user?.labels?.includes("Teacher");
  const isAdmin = user?.labels?.includes("admin");
  const isStudent = user && !isTeacher && !isAdmin;

  const { activeBatchId, userBatches } = useSelector((state) => state.activeBatch);
  
  // A student is batch-enrolled only if they have an approved batch Request.
  // Teachers and admins always count as enrolled.
  const isStudentEnrolled = !isStudent || userBatches?.length > 0;
  const hasNoBatches = !userBatches || userBatches.length === 0;

  const dynamicBatchRoute = location.pathname.match(/^\/batches\/[^/]+\/(settings|students|records)$/);
  const dynamicHeading = dynamicBatchRoute
    ? { settings: "Batch Settings", students: "Manage Enrollment", records: "Batch Records & Activity" }[dynamicBatchRoute[1]]
    : "";
  const currentHeading = pathToHeading[location.pathname] || dynamicHeading;

  useEffect(() => {
    const activeGroup = menuConfig.find((item) =>
      item.group && item.children?.some((child) =>
        (child.activePaths || [child.path]).some((path) => matchesRoutePattern(path, location.pathname))
      )
    );
    setExpandedGroup(activeGroup?.group || "");
  }, [location.pathname]);

  const handleLogout = async () => {
    if (isLoading || !user) return;

    try {
      setIsLogoutLoading(true);
      await authService.logout();
      // Clear profile cache so next login doesn't get stale data
      userProfileService.clearCache();
      dispatch(removeUser());
      dispatch(removeProfile());
      dispatch(clearActiveBatch());

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

  const MenuGroup = ({ title, icon: Icon, children, isOpen, onToggle }) => (
    <section className="w-full">
      <Button
        type="button"
        variant="ghost"
        aria-expanded={isOpen}
        aria-controls={`nav-group-${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
        className={`group h-11 w-full justify-between rounded-xl px-3 text-sm font-semibold transition-colors duration-200 motion-reduce:transition-none ${
          isOpen
            ? "bg-primary/10 text-primary dark:bg-primary/15"
            : "text-slate-700 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800/70"
        }`}
        onClick={onToggle}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon className="h-[18px] w-[18px] shrink-0 opacity-75" />
          <span className="truncate">{title}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-aria-expanded:rotate-180 motion-reduce:transition-none" />
      </Button>
      <div
        id={`nav-group-${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`}
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={`ml-5 space-y-1 border-l border-slate-200 py-1 pl-3 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none dark:border-slate-800 ${isOpen ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"}`}>
            {children}
          </div>
        </div>
      </div>
    </section>
  );

  const MenuItem = ({ to, icon: Icon, children, onClick, activePaths }) => {
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
            `group flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200 motion-reduce:transition-none ${
              (activePaths
                ? activePaths.some((path) => matchesRoutePattern(path, location.pathname))
                : isActive)
                ? "bg-primary/10 font-semibold text-primary dark:bg-primary/15"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
            } ${isLoading ? "pointer-events-none opacity-50" : "cursor-pointer"}`
          }
          onClick={handleMenuClick}
        >
          <Icon className="h-4 w-4 shrink-0 opacity-75 group-hover:opacity-100" />
          <span className="truncate">{children}</span>
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
                {userBatches
                  .filter((b) => b && (b.isActive === true || b.isActive === undefined || b.$id === activeBatchId))
                  .map((b) => {
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
                {userBatches
                  .filter((b) => b && (b.isActive === true || b.isActive === undefined || b.$id === activeBatchId))
                  .map((b) => (
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
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-950">
      <div className="border-b border-slate-200/80 px-4 pb-4 pt-5 dark:border-slate-800">
        <div className="flex items-center gap-3 pr-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10">
            <img src={logo} alt="" className="h-9 w-9 object-contain" />
          </div>
          <div className="min-w-0">
            <SheetTitle className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">{currentHeading || "Main menu"}</SheetTitle>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <GraduationCap className="h-3.5 w-3.5" /> ITI Mitra
            </p>
            <SheetDescription className="sr-only">
              Navigation menu for the application
            </SheetDescription>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200/80 px-4 py-3 dark:border-slate-800">{renderUserProfile()}</div>

      <ScrollArea className="min-h-0 flex-1 px-3 py-4">
        <div className="space-y-1">
        {menuConfig.map((configItem, index) => {
          if (configItem.roles && !hasRole(configItem.roles)) return null;
          if (configItem.requiresAuth && !user) return null;
          // Hide batch-required sections for unenrolled students
          if (configItem.requiresBatch && !isStudentEnrolled) return null;

          if (configItem.group) {
            const visibleChildren = configItem.children.filter((child) =>
              (!child.requiresAuth || user) &&
              (!child.roles || hasRole(child.roles)) &&
              (!child.requiresBatch || isStudentEnrolled) &&
              (!child.hideIfNoBatch || !hasNoBatches)
            );
            if (visibleChildren.length === 0) return null;

            return (
              <MenuGroup
                key={index}
                title={configItem.group}
                icon={configItem.icon}
                isOpen={expandedGroup === configItem.group}
                onToggle={() => setExpandedGroup((current) =>
                  current === configItem.group ? "" : configItem.group
                )}
              >
                {visibleChildren.map((child, idx) => {
                  let label = child.label;
                  if (child.teacherLabel && child.studentLabel) {
                    label = isTeacher ? child.teacherLabel : child.studentLabel;
                  }
                  return (
                    <MenuItem key={idx} to={child.path} icon={child.icon} activePaths={child.activePaths}>
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
                    <MenuItem key={idx} to={child.path} icon={child.icon} activePaths={child.activePaths}>
                  {label}
                </MenuItem>
              );
            });
          }
          return null;
        })}
        </div>
      </ScrollArea>

      <div className="space-y-2 border-t border-slate-200/80 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-950/95">
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-full justify-start gap-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
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
            className="h-10 w-full justify-start gap-3 rounded-xl text-red-600 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-red-400 dark:hover:text-red-400"
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
              className="h-10 w-full justify-start gap-3 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => {
                if (!isLoading) {
                  setIsNavOpen(false);
                  navigate("/login");
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
              className="h-10 w-full justify-start gap-3 rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              onClick={() => {
                if (!isLoading) {
                  setIsNavOpen(false);
                  navigate("/signup");
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
            {/* Relative wrapper so the online dot can be absolutely positioned */}
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-all ring-2 ring-transparent hover:ring-pink-200 dark:hover:ring-pink-900/50">
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={fixProfileImage(profile?.profileImage)} />
                  <AvatarFallback className="bg-gradient-to-tr from-pink-600 to-purple-600 text-white font-medium text-xs">
                    {profile?.userName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                {/* Live presence dot — bottom-right of avatar */}
                <OnlineIndicator
                  userId={user?.$id}
                  size="sm"
                  className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-slate-950"
                />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-2xl p-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl mt-1">
            <div className="flex items-center justify-start gap-3 p-3 bg-gradient-to-br from-pink-500/10 to-purple-500/10 dark:from-pink-500/20 dark:to-purple-500/20 rounded-xl mb-2 border border-pink-100/50 dark:border-pink-900/30">
              <Avatar className="h-12 w-12 ring-2 ring-pink-500/30 dark:ring-pink-500/50 shadow-sm">
                <AvatarImage src={fixProfileImage(profile?.profileImage)} />
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
    <nav aria-label="Primary navigation" className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-xl transition-colors duration-300 motion-reduce:transition-none dark:border-slate-800/80 dark:bg-slate-950/85">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 relative">
        <div className="flex items-center gap-3 md:gap-5">
          {/* Mobile Menu Trigger */}
          <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="mr-1 rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
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
              className="w-[min(22rem,calc(100vw-1.5rem))] border-l border-slate-200/80 p-0 shadow-2xl dark:border-slate-800 sm:max-w-sm"
              onInteractOutside={() => setIsNavOpen(false)}
            >
              {renderNavContent()}
            </SheetContent>
          </Sheet>

          {/* Logo and App Title */}
          <NavLink to="/" className="flex items-center gap-2 sm:gap-3 ml-0.5 md:ml-0 group transition-all duration-200 hover:opacity-90 min-w-0">
            <img src={logo} alt="ITI" className="h-[42px] w-[42px] sm:h-[52px] sm:w-[52px] object-contain transform group-hover:scale-105 transition-transform duration-200 shrink-0" />
            {isLoading ? (
              <Skeleton className="h-5 w-24 sm:w-32 rounded-md" />
            ) : (
              <span className="font-extrabold text-xs sm:text-[15px] max-w-[120px] xs:max-w-[180px] sm:max-w-none truncate bg-gradient-to-br from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
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
