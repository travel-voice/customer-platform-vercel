"use client";

import { AnimatePresence,motion } from "framer-motion";
import { 
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LogOut,
  Menu,
  Phone,
  Settings} from "lucide-react";
import Link from "next/link";
import { usePathname,useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/stores/auth-store";

// Custom Dashboard Icon
const DashboardIcon = ({ isActive = false, isCollapsed = false }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 25 25" 
    fill="none"
    className={`transition-colors duration-300 ${
      isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
    } ${
      isActive ? 'text-[#1AADF0]' : 'text-gray-600 group-hover:text-[#1AADF0]'
    }`}
  >
    <g clipPath="url(#clip0_14_12)">
      <path d="M5.48298 5.67177L7.50384 5.67177L7.50384 9.71348L5.48298 9.71348L5.48298 5.67177ZM5.48298 15.7761L11.5456 15.7761L11.5456 19.8178L5.48298 19.8178L5.48298 15.7761ZM13.5664 5.67177L19.629 5.67177L19.629 9.71348L13.5664 9.71348L13.5664 5.67177ZM17.6081 15.7761L19.629 15.7761L19.629 19.8178L17.6081 19.8178L17.6081 15.7761ZM3.46212 3.65091L3.46212 11.7343L9.52469 11.7343L9.52469 3.65091L3.46212 3.65091ZM3.46212 13.7552L3.46212 21.8386L13.5664 21.8386L13.5664 13.7552L3.46212 13.7552ZM11.5456 3.65091L11.5456 11.7343L21.6498 11.7343L21.6498 3.65091L11.5456 3.65091ZM15.5873 13.7552L15.5873 21.8386L21.6498 21.8386L21.6498 13.7552L15.5873 13.7552Z" fill="currentColor" fillOpacity="1"/>
    </g>
    <defs>
      <clipPath id="clip0_14_12">
        <rect width="24.2503" height="24.2503" fill="white" transform="translate(0.432533 24.8707) rotate(-90)"/>
      </clipPath>
    </defs>
  </svg>
);

// Custom Characters Icon
const CharactersIcon = ({ isActive = false, isCollapsed = false }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 25 25" 
    fill="none"
    className={`transition-colors duration-300 ${
      isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
    } ${
      isActive ? 'text-[#1AADF0]' : 'text-gray-600 group-hover:text-[#1AADF0]'
    }`}
  >
    <g clipPath="url(#clip0_14_20)">
      <path d="M9.52404 14.4316C7.15964 14.4316 2.45105 15.6138 2.45105 17.9681V19.7363H16.597V17.9681C16.597 15.6138 11.8884 14.4316 9.52404 14.4316ZM4.81545 17.7155C5.66421 17.1294 7.71538 16.4524 9.52404 16.4524C11.3327 16.4524 13.3839 17.1294 14.2326 17.7155H4.81545ZM9.52404 12.6633C11.4742 12.6633 13.0605 11.077 13.0605 9.12683C13.0605 7.1767 11.4742 5.59033 9.52404 5.59033C7.57392 5.59033 5.98755 7.1767 5.98755 9.12683C5.98755 11.077 7.57392 12.6633 9.52404 12.6633ZM9.52404 7.61119C10.3627 7.61119 11.0397 8.28818 11.0397 9.12683C11.0397 9.96549 10.3627 10.6425 9.52404 10.6425C8.68539 10.6425 8.0084 9.96549 8.0084 9.12683C8.0084 8.28818 8.68539 7.61119 9.52404 7.61119ZM16.6375 14.4922C17.8096 15.341 18.6179 16.4726 18.6179 17.9681V19.7363H22.6596V17.9681C22.6596 15.927 19.1231 14.765 16.6375 14.4922ZM15.5866 12.6633C17.5367 12.6633 19.1231 11.077 19.1231 9.12683C19.1231 7.1767 17.5367 5.59033 15.5866 5.59033C15.041 5.59033 14.5358 5.72169 14.071 5.94398C14.7075 6.84326 15.0814 7.94463 15.0814 9.12683C15.0814 10.309 14.7075 11.4104 14.071 12.3097C14.5358 12.532 15.041 12.6633 15.5866 12.6633Z" fill="currentColor"/>
    </g>
    <defs>
      <clipPath id="clip0_14_20">
        <rect width="24.2503" height="24.2503" fill="white" transform="translate(0.432423 0.537598)"/>
      </clipPath>
    </defs>
  </svg>
);

const sidebarVariants = {
  hidden: { x: -100, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6 }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.2 }
  }
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(true); // Default to collapsed
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Redirect to sign in if not authenticated
    if (!isAuthenticated && user !== null) {
      router.push('/auth/sign-in');
    }
  }, [isAuthenticated, user, router]);

  // Update document title for all dashboard pages
  useEffect(() => {
    const prefix = 'Travel Voice: ';
    const getPageTitle = (path: string) => {
      if (!path) return 'Dashboard';
      // Normalize trailing slash
      const p = path.replace(/\/$/, '');
      if (p === '/' || p === '/home') return 'Home';
      // Agents (new) and Characters (legacy) paths
      if (p === '/agents' || p === '/characters') return 'Agents';
      if (p === '/agents/create' || p === '/characters/create') return 'Create Agent';
      if (/^\/(agents|characters)\/[^\/]+$/.test(p)) return 'Agent';
      if (/^\/(agents|characters)\/[^\/]+\/records\/[^\/]+$/.test(p)) return 'Recording';
      if (p === '/phone-numbers') return 'Manage Phone Numbers';
      if (p === '/payment') return 'Billing';
      if (p === '/payment/confirmation') return 'Payment Confirmation';
      if (p === '/settings') return 'Settings';
      return 'Dashboard';
    };
    const title = prefix + getPageTitle(pathname || '');
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/sign-in');
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const navigation = [
    { name: 'Dashboard', href: '/home', icon: DashboardIcon },
    { name: 'Agents', href: '/agents', icon: CharactersIcon },
    { 
      name: 'Manage Phone Numbers', 
      href: '/phone-numbers', 
             icon: ({ isActive = false, isCollapsed = false }) => (
         <Phone className={`transition-colors duration-300 ${
            isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
         } ${
           isActive ? 'text-[#1AADF0]' : 'text-gray-600 group-hover:text-[#1AADF0]'
         }`} />
      )
    },
    { 
      name: 'Billing', 
      href: '/payment', 
             icon: ({ isActive = false, isCollapsed = false }) => (
         <CreditCard className={`transition-colors duration-300 ${
            isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
         } ${
           isActive ? 'text-[#1AADF0]' : 'text-gray-600 group-hover:text-[#1AADF0]'
         }`} />
      )
    },
    { 
      name: 'Settings', 
      href: '/settings', 
             icon: ({ isActive = false, isCollapsed = false }) => (
         <Settings className={`transition-colors duration-300 ${
            isCollapsed ? 'w-6 h-6' : 'w-5 h-5'
         } ${
           isActive ? 'text-[#1AADF0]' : 'text-gray-600 group-hover:text-[#1AADF0]'
         }`} />
      )
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#C9EEFE]/20">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-[#1AADF0] border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-[#C9EEFE]/20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#1AADF0]/5 to-[#F52E60]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-[#F52E60]/5 to-[#1AADF0]/5 rounded-full blur-3xl" />
      </div>

      <div className="flex min-h-screen relative z-10">
        {/* Sidebar */}
        <motion.aside 
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          className={`fixed left-0 top-0 h-full bg-white/70 backdrop-blur-xl border-r border-white/20 shadow-xl flex-col z-20 transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          } hidden md:flex`}
        >
          {/* Logo Section */}
          <div className={`py-8 border-b border-gray-100 ${isCollapsed ? 'px-2' : 'px-6'}`}>
            <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <img 
                src="/Sidebar Icon.svg" 
                alt="Travel Voice Logo" 
                className={`flex-shrink-0 transition-all duration-300 w-10 h-10`}
              />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.h1 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xl font-bold text-[#1E1E1E] whitespace-nowrap"
                  >
                    Travel Voice
                  </motion.h1>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 px-4 py-6 space-y-2 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {navigation.map((item, index) => {
              const isActive = pathname === item.href || (item.href === '/home' && pathname === '/');
              const Icon = item.icon;
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index + 0.3 }}
                >
                  <Link href={item.href}>
                    <div className={`group relative flex items-center text-sm font-medium rounded-xl transition-all duration-300 ${
                      isCollapsed ? 'w-12 h-12 justify-center' : 'px-4 py-3'
                    } ${
                      isActive 
                        ? 'bg-[#1AADF0]/10 text-[#1AADF0] border border-[#1AADF0]/20 shadow-md' 
                        : 'text-gray-700 hover:bg-white/80 hover:shadow-md hover:transform hover:scale-105'
                    }`}>
                      <Icon isActive={isActive} isCollapsed={isCollapsed} />
                      
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span 
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-3 whitespace-nowrap"
                          >
                            {item.name}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      
                      {isActive && !isCollapsed && (
                        <ChevronRight className="w-4 h-4 ml-auto text-[#1AADF0]" />
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User Section and Toggle Button */}
          <div className={`px-4 py-6 border-t border-gray-100 space-y-4 ${isCollapsed ? 'px-2' : ''}`}>
            {isCollapsed ? (
              /* Collapsed User Section - Just Avatar */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full flex items-center justify-center px-3 py-3 hover:bg-white/80 hover:shadow-md transition-all duration-300"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} alt={user.first_name} />
                      <AvatarFallback className="text-sm bg-gradient-to-r from-[#1AADF0] to-[#F52E60] text-white">
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-white/90 backdrop-blur-xl border border-white/20" align="start" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/payment" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Expanded User Section */
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start px-4 py-3 h-auto hover:bg-white/80 hover:shadow-md transition-all duration-300"
                    >
                      <Avatar className="w-8 h-8 mr-3">
                        <AvatarImage src={user.avatar} alt={user.first_name} />
                        <AvatarFallback className="text-sm bg-gradient-to-r from-[#1AADF0] to-[#F52E60] text-white">
                          {getInitials(user.first_name, user.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </span>
                        <span className="text-xs text-gray-500 truncate max-w-32">
                          {user.email}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white/90 backdrop-blur-xl border border-white/20" align="start" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs leading-none text-gray-500">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Account Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/payment" className="cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Billing</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Logout Button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="w-full text-gray-600 border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </Button>
                </motion.div>
              </>
            )}

            {/* Toggle Button - Moved to bottom */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`w-full flex items-center hover:bg-white/80 transition-all duration-300 ${
                isCollapsed ? 'justify-center px-3 py-3' : 'justify-center px-4 py-2'
              }`}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm text-gray-600">Collapse</span>
                </>
              )}
            </Button>
          </div>
        </motion.aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-xl flex flex-col z-40 md:hidden"
              >
                <div className="px-6 py-8 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <img src="/Sidebar Icon.svg" alt="Travel Voice Logo" className="w-8 h-8" />
                    <h1 className="text-xl font-bold text-[#1E1E1E]">Travel Voice</h1>
                  </div>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || (item.href === '/home' && pathname === '/');
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                          isActive ? 'bg-[#1AADF0]/10 text-[#1AADF0]' : 'text-gray-700 hover:bg-white/80'
                        }`}
                      >
                        <Icon isActive={isActive} isCollapsed={false} />
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Wrapper */}
        <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          {/* Mobile Header */}
          <header className="md:hidden sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white/70 backdrop-blur-lg px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open menu</span>
            </Button>
            
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-sm bg-gradient-to-r from-[#1AADF0] to-[#F52E60] text-white">
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white/90 backdrop-blur-xl border-white/20">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-gray-900">{user.first_name} {user.last_name}</p>
                      <p className="text-xs leading-none text-gray-500">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/payment" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Billing</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <motion.main 
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="flex-1 px-4 py-6 md:px-8 md:py-8"
          >
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
} 