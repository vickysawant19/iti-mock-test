import React, { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

// Import icons
import { Menu, User, LogOut, ChevronRight, Sun, Moon } from "lucide-react";
import logo from "@/assets/logo.jpeg"

// Import services and store actions
import authService from "@/appwrite/auth";
import {
  removeUser,
  selectUser,
  selectUserLoading,
} from "@/store/userSlice"
import { removeProfile, selectProfile } from "@/store/profileSlice";

import { menuConfig, pathToHeading } from "./navMenu";

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

  const isTeacher = user?.labels?.includes("Teacher");
  const isAdmin = user?.labels?.includes("admin");
  const isStudent = user && !isTeacher && !isAdmin;

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
        navigate("/login");
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
        onClick={handleMenuClick}
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
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={profile?.profileImage} />
          <AvatarFallback>{profile?.userName?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
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
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                if (!isLoading) {
                  navigate("/login");
                  setIsNavOpen(false);
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
              className="w-full justify-start gap-2"
              onClick={() => {
                if (!isLoading) {
                  navigate("/signup");
                  setIsNavOpen(false);
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
        <Button variant="ghost" size="sm" asChild disabled={isLoading}>
          <NavLink to="/login">Login </NavLink>
        </Button>
        <Button size="sm" asChild disabled={isLoading}>
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

          {/* User Menu */}
          {renderUserMenu()}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
