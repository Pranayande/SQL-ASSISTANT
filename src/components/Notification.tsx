import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

// Props interface for the Notification component
interface NotificationProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

// Component to display temporary notifications with progress bar
const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  autoClose = true,
  autoCloseDuration = 5000,
}) => {
  // State to track the progress of the auto-close timer
  const [progress, setProgress] = useState(100);
  // Ref to store the interval ID for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to handle auto-close functionality with progress bar
  useEffect(() => {
    if (autoClose) {
      const start = Date.now();

      // Update progress bar every 100ms
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const percentLeft = 100 - (elapsed / autoCloseDuration) * 100;
        setProgress(Math.max(0, percentLeft));
      }, 100);

      // Close notification after specified duration
      const timer = setTimeout(() => {
        onClose();
        clearInterval(intervalRef.current!);
      }, autoCloseDuration);

      // Cleanup timers on component unmount
      return () => {
        clearTimeout(timer);
        clearInterval(intervalRef.current!);
      };
    }
  }, [autoClose, autoCloseDuration, onClose]);

  // Map notification type to corresponding icon
  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />
  };

  // Map notification type to progress bar color
  const barColorMap = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    warning: 'bg-yellow-600'
  };

  // Render the notification with animation
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed top-6 right-6 z-50 w-96 bg-white shadow-lg rounded-md border border-gray-200 overflow-hidden"
      >
        {/* Notification content with icon, message, and close button */}
        <div className="flex items-center p-4 gap-3">
          <div className="flex-shrink-0">
            {iconMap[type]}
          </div>
          <div className="flex-1 text-sm text-gray-800">
            {message}
          </div>
          <button 
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Progress bar indicating remaining time */}
        <div className="h-1 w-full bg-gray-200">
          <div
            className={`${barColorMap[type]} h-full transition-all duration-100`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Notification;