import {
  AlignJustify,
  Settings,
  User,
  Wallet,
  X,
  Minus,
  Plus,
  BanknoteIcon as Bank,
  Check,
  ChevronDown,
  ChevronUp,
  LogOutIcon,
  LayoutDashboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Bell,
  MessageSquare,
  ShoppingCart,
  Heart,
  Calendar,
  AlertTriangle,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./screen/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import axios from "axios";
import io from "socket.io-client";

export default function Navbar() {
  const [menubar, setMenubar] = useState(false);
  const { user, logout, loading: authLoading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [socket, setSocket] = useState(null);

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  useEffect(() => {
    if (authLoading || !user) {
      console.log("Waiting for auth to initialize or no user...");
      setIsLoadingBalance(false);
      return;
    }

    // Initialize Socket.IO connection
    const newSocket = io(import.meta.env.VITE_BASE_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Join user-specific room
    newSocket.emit("join", user._id);

    // Listen for creditsUpdate event (emitted during credit deductions)
    newSocket.on("creditsUpdate", (data) => {
      console.log("Received creditsUpdate:", data);
      if (data.userId === user._id) {
        setWalletBalance(data.credits || 0);
        setIsLoadingBalance(false);
      }
    });

    // Listen for sessionUpdate event (emitted every second during sessions)
    newSocket.on("sessionUpdate", (data) => {
      console.log("Received sessionUpdate:", data);
      if (data.userId === user._id) {
        setWalletBalance(data.credits || 0);
        setIsLoadingBalance(false);
      }
    });

    // Listen for walletUpdate event (emitted during balance fetch or credit additions)
    newSocket.on("walletUpdate", (data) => {
      console.log("Received walletUpdate:", data);
      setWalletBalance(data.credits || 0);
      setIsLoadingBalance(false);
    });

    // Handle connection errors
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Connection issue. Reconnecting...");
    });

    // Fetch initial wallet balance
    const fetchWalletBalance = async () => {
      setIsLoadingBalance(true);
      try {
        console.log("Making wallet balance request...");
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/wallet/balance`,
          { withCredentials: true }
        );
        console.log("Response data:", response.data);
        setWalletBalance(response.data.credits || 0);
      } catch (error) {
        console.error("Error fetching balance:", error);
        setWalletBalance(0);
        toast.error("Failed to fetch wallet balance");
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchWalletBalance();

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [user, authLoading]);

  const handleMenu = () => {
    setMenubar(!menubar);
  };

  const handleLogout = () => {
    logout();
    toast.success("Logout successful");
    navigate("/");
  };

  const [openDropdown, setOpenDropdown] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      title: "New Message",
      message: "Sarah sent you a message: 'Hey, how are you doing?'",
      time: "2 min ago",
      read: false,
      type: "message",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "2",
      title: "Order Confirmed",
      message: "Your order #12345 has been confirmed and is being processed.",
      time: "15 min ago",
      read: false,
      type: "purchase",
    },
    {
      id: "3",
      title: "New Like",
      message: "Michael liked your recent post 'My new project launch'",
      time: "1 hour ago",
      read: false,
      type: "like",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "4",
      title: "Meeting Reminder",
      message: "You have a team meeting scheduled in 30 minutes.",
      time: "2 hours ago",
      read: true,
      type: "reminder",
    },
    {
      id: "5",
      title: "Security Alert",
      message: "Unusual login attempt detected from a new device.",
      time: "Yesterday",
      read: true,
      type: "alert",
    },
    {
      id: "6",
      title: "System Update",
      message: "The platform will be updated tonight at 2 AM. Expect 10 minutes downtime.",
      time: "2 days ago",
      read: true,
      type: "info",
    },
  ]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  const closeAllMenus = () => {
    setIsMobileProfileOpen(false);
    setMenubar(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    closeAllMenus();
  };

  const toggleMobileProfile = () => {
    setIsMobileProfileOpen(!isMobileProfileOpen);
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const toggleDropdown1 = () => {
    setIsOpen(!isOpen);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "purchase":
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case "like":
        return <Heart className="h-4 w-4 text-rose-500" />;
      case "reminder":
        return <Calendar className="h-4 w-4 text-amber-500" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "info":
        return <Info className="h-4 w-4 text-sky-500" />;
    }
  };

  const [amount, setAmount] = useState(5);

  const handlePresetAmount = (value) => {
    setAmount(value);
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod || !selectedPlan) return;

    setIsProcessing(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/payments/topup`,
        {
          amount: selectedPlan.price,
          planName: selectedPlan.name,
          creditsPurchased: selectedPlan.credits,
          paymentMethod: selectedPaymentMethod,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      localStorage.setItem("lastPaymentId", response.data.paymentId);
      console.log("Navbar: Initiating payment", {
        paymentId: response.data.paymentId,
        paymentUrl: response.data.paymentUrl,
      });
      window.location.href = response.data.paymentUrl;
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Animation variants for menu items
  const menuItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <>
      <div
        className={`w-full lg:hidden duration-300 transition-all ${
          menubar ? "left-0" : "left-[-100%]"
        } absolute top-[95px] z-50`}
      >
        <motion.ul
          className="w-full flex flex-col gap-4 bg-[#EEEEEE] py-4 px-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.li variants={menuItemVariants}>
            <Link onClick={closeAllMenus} to="/about">
              <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                About
              </span>
            </Link>
          </motion.li>
          <motion.li variants={menuItemVariants}>
            <Link onClick={closeAllMenus} to="/contact">
              <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                Contact
              </span>
            </Link>
          </motion.li>
          <motion.li variants={menuItemVariants}>
            <Link onClick={closeAllMenus} to="/terms-&-conditions">
              <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                Terms & Conditions
              </span>
            </Link>
          </motion.li>
          {!user && (
            <motion.div variants={menuItemVariants} className="flex items-center gap-4">
              <Link to="/login">
                <Button
                  variant="outline"
                  className="text-sm w-full bg-white hover:bg-[#3B5EB7] hover:text-white transition-colors duration-300"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  variant="outline"
                  className="text-sm w-full bg-white hover:bg-[#3B5EB7] hover:text-white transition-colors duration-300"
                >
                  Sign up
                </Button>
              </Link>
            </motion.div>
          )}
          {user && (
            <motion.li variants={menuItemVariants}>
              <div className="pt-4 pb-3 w-full border border-gray-200 rounded-md shadow-sm">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.image || null} alt="User" />
                        <AvatarFallback className="bg-[#3B5EB7] text-white">
                          {user?.email?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="top-0 left-7 absolute w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user?.name || user?.email?.split("@")[0] || "User"}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user?.email || "No email"}
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <Link
                    to="/dashboard"
                    onClick={() => {
                      toggleMobileProfile();
                      toggleMobileMenu();
                    }}
                  >
                    <p className="flex items-center gap-1 cursor-pointer my-4 text-black hover:text-[#3B5EB7]">
                      <LayoutDashboard /> Dashboard
                    </p>
                  </Link>
                  <Link
                    to="/update-profile"
                    onClick={() => {
                      toggleMobileProfile();
                      toggleMobileMenu();
                    }}
                  >
                    <p className="flex items-center gap-1 cursor-pointer my-4 text-black hover:text-[#3B5EB7]">
                      <User /> Update Profile
                    </p>
                  </Link>
                  <p
                    className="cursor-pointer my-4 text-black flex items-center gap-1 hover:text-[#3B5EB7]"
                    onClick={() => {
                      handleLogout();
                      toggleMobileProfile();
                      toggleMobileMenu();
                    }}
                  >
                    <LogOutIcon /> Logout
                  </p>
                </div>
              </div>
            </motion.li>
          )}
        </motion.ul>
      </div>
      <header className="overflow-hidden border-b top-0 bg-[#EEEEEE] z-[100] shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Link to="/">
                <motion.img
                  src="/images/newLogo.jpg"
                  alt="logo"
                  className="h-16 w-16 rounded-full object-cover"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <motion.ul
                className="flex max-lg:hidden items-center gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.1 } },
                }}
              >
                <motion.li variants={menuItemVariants}>
                  <Link to="/about">
                    <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                      About
                    </span>
                  </Link>
                </motion.li>
                <motion.li variants={menuItemVariants}>
                  <Link to="/contact">
                    <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                      Contact
                    </span>
                  </Link>
                </motion.li>
                <motion.li variants={menuItemVariants}>
                  <Link to="/terms-&-conditions">
                    <span className="text-[#3B5EB7] hover:text-[#88a7f5] cursor-pointer text-lg font-medium">
                      Terms & Conditions
                    </span>
                  </Link>
                </motion.li>
                {!user && (
                  <motion.div variants={menuItemVariants} className="flex items-center gap-4">
                    <Link to="/login">
                      <Button
                        variant="outline"
                        className="text-sm bg-white hover:bg-[#3B5EB7] hover:text-white transition-colors duration-300 px-6 py-2"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button
                        variant="outline"
                        className="text-sm bg-white hover:bg-[#3B5EB7] hover:text-white transition-colors duration-300 px-6 py-2"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </motion.div>
                )}
              </motion.ul>
              <div className="lg:hidden z-[50]">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <AlignJustify onClick={handleMenu} className="cursor-pointer" />
                </motion.div>
              </div>
              <div className="flex items-center gap-4">
                {user && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <motion.div
                        className="relative group w-full flex px-2 text-white bg-[#3B5EB7] rounded-sm py-1 items-center gap-2 cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Wallet className="h-5 w-5" />
                        {authLoading || isLoadingBalance ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading...</span>
                          </div>
                        ) : (
                          <span>Credits={walletBalance.toFixed(2)}</span>
                        )}
                      </motion.div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Buy Chat Credits</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <h3 className="text-base font-medium text-center">
                            Choose a credit package
                          </h3>
                          <div className="grid gap-4">
                            <motion.div
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                amount === 6.99 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                              onClick={() => {
                                handlePresetAmount(6.99);
                                setSelectedPlan({
                                  name: 'Starter Plan',
                                  credits: 10,
                                  price: 6.99,
                                  pricePerMinute: 0.70
                                });
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium">Starter Plan</h4>
                                  <p className="text-sm text-gray-500">10 credits (10 minutes)</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">€6.99</p>
                                  <p className="text-xs text-gray-500">€0.70/min</p>
                                </div>
                              </div>
                              {amount === 6.99 && (
                                <div className="mt-2 text-right">
                                  <Check className="w-5 h-5 text-blue-500 inline" />
                                </div>
                              )}
                            </motion.div>
                            <motion.div
                              className={`border rounded-lg p-4 cursor-pointer transition-all relative ${
                                amount === 11.99 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                              onClick={() => {
                                handlePresetAmount(11.99);
                                setSelectedPlan({
                                  name: 'Popular Plan',
                                  credits: 20,
                                  price: 11.99,
                                  pricePerMinute: 0.60
                                });
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="absolute top-0 right-0 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
                                POPULAR
                              </div>
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium">Popular Plan</h4>
                                  <p className="text-sm text-gray-500">20 credits (20 minutes)</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">€11.99</p>
                                  <p className="text-xs text-gray-500">€0.60/min</p>
                                </div>
                              </div>
                              {amount === 11.99 && (
                                <div className="mt-2 text-right">
                                  <Check className="w-5 h-5 text-blue-500 inline" />
                                </div>
                              )}
                            </motion.div>
                            <motion.div
                              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                amount === 16.99 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                              onClick={() => {
                                handlePresetAmount(16.99);
                                setSelectedPlan({
                                  name: 'Deep Dive Plan',
                                  credits: 30,
                                  price: 16.99,
                                  pricePerMinute: 0.57
                                });
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium">Deep Dive Plan</h4>
                                  <p className="text-sm text-gray-500">30 credits (30 minutes)</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">€16.99</p>
                                  <p className="text-xs text-gray-500">€0.57/min</p>
                                </div>
                              </div>
                              {amount === 16.99 && (
                                <div className="mt-2 text-right">
                                  <Check className="w-5 h-5 text-blue-500 inline" />
                                </div>
                              )}
                            </motion.div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-base font-medium text-center">
                            Select Payment Method
                          </h3>
                          <div className="space-y-2">
                            <motion.button
                              variant="outline"
                              className={`w-full justify-between h-auto py-3 px-4 border rounded-md ${
                                selectedPaymentMethod === "ideal" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                              }`}
                              onClick={() => handlePaymentMethodSelect("ideal")}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src="https://www.mollie.com/external/icons/payment-methods/ideal.png"
                                  alt="iDEAL"
                                  className="h-6"
                                />
                                <span className="font-medium">iDEAL</span>
                              </div>
                              {selectedPaymentMethod === "ideal" && (
                                <Check className="w-5 h-5 text-blue-500" />
                              )}
                            </motion.button>
                            <motion.button
                              variant="outline"
                              className={`w-full justify-between h-auto py-3 px-4 border rounded-md ${
                                selectedPaymentMethod === "creditcard" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                              }`}
                              onClick={() => handlePaymentMethodSelect("creditcard")}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src="https://www.mollie.com/external/icons/payment-methods/creditcard.png"
                                  alt="Credit Card"
                                  className="h-6"
                                />
                                <span className="font-medium">Credit Card</span>
                              </div>
                              {selectedPaymentMethod === "creditcard" && (
                                <Check className="w-5 h-5 text-blue-500" />
                              )}
                            </motion.button>
                            <motion.button
                              variant="outline"
                              className={`w-full justify-between h-auto py-3 px-4 border rounded-md ${
                                selectedPaymentMethod === "bancontact" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                              }`}
                              onClick={() => handlePaymentMethodSelect("bancontact")}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src="https://www.mollie.com/external/icons/payment-methods/bancontact.png"
                                  alt="Bancontact"
                                  className="h-6"
                                />
                                <span className="font-medium">Bancontact</span>
                              </div>
                              {selectedPaymentMethod === "bancontact" && (
                                <Check className="w-5 h-5 text-blue-500" />
                              )}
                            </motion.button>
                          </div>
                        </div>
                        <motion.button
                          className="w-full bg-[#3B5EB7] hover:bg-[#2d4a9b] text-white font-medium py-2 rounded-md"
                          disabled={!selectedPaymentMethod || !selectedPlan || isProcessing}
                          onClick={handlePayment}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {isProcessing ? (
                            <div className="flex items-center gap-2 justify-center">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing...
                            </div>
                          ) : (
                            `Pay €${amount.toFixed(2)}`
                          )}
                        </motion.button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {user && (
                  <div className="lg:block hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.div 
                          className="flex items-center gap-2 cursor-pointer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user?.image || null} alt="User" />
                            <AvatarFallback className="bg-[#3B5EB7] text-white">
                              {user?.email?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Profile</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link to="/dashboard">
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link to="/update-profile">
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Update Profile</span>
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Link to="/login"></Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}