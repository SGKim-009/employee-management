import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
    });
  },
  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-right',
    });
  },
  info: (message: string) => {
    toast(message, {
      icon: 'ℹ️',
      duration: 3000,
      position: 'top-right',
    });
  },
  warning: (message: string) => {
    toast(message, {
      icon: '⚠️',
      duration: 3000,
      position: 'top-right',
    });
  },
};





