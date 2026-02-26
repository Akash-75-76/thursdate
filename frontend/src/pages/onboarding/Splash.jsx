import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, userAPI } from "../../utils/api";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      // Check auth state
      if (authAPI.isAuthenticated()) {
        try {
          // Check if onboarding info exists
          const userData = await userAPI.getProfile();
          
          // Check if user has completed both UserInfo and UserIntent
          if (userData.onboardingComplete) {
            // User has completed both UserInfo and UserIntent
            if (userData.approval) {
              navigate("/home", { replace: true });
            } else {
              navigate("/waitlist-status", { replace: true });
            }
          } else if (userData.firstName && userData.lastName) {
            // User has completed UserInfo but not UserIntent
            navigate("/user-intent", { replace: true });
          } else {
            // User hasn't completed UserInfo yet
            navigate("/user-info", { replace: true });
          }
        } catch (error) {
          // If profile doesn't exist, go to user-info
          navigate("/user-info", { replace: true });
        }
      } else {
        navigate("/gateway", { replace: true });
      }
    }, 1000); // Shorter splash for better UX
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-[#222222]">
      <img src="/logo.png" alt="Sundate" className="h-16 w-auto" />
    </div>
  );
}
