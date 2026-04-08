import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, userAPI } from "../../utils/api";
import { loadOnboardingState, STORAGE_KEYS } from "../../utils/onboardingPersistence";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(async () => {
      // Check auth state
      if (authAPI.isAuthenticated()) {
        try {
          // Check localStorage first for incomplete onboarding states
          // This allows users to resume from exactly where they left
          const userInfoState = loadOnboardingState(STORAGE_KEYS.USER_INFO);
          const userIntentState = loadOnboardingState(STORAGE_KEYS.USER_INTENT);
          const profileQuestionsState = loadOnboardingState(STORAGE_KEYS.PROFILE_QUESTIONS);

          // If user has incomplete UserInfo state, return them to UserInfo
          if (userInfoState) {
            console.log('[Splash] Resuming UserInfo at step:', userInfoState.step);
            navigate("/user-info", { replace: true });
            return;
          }

          // If user has incomplete UserIntent state, return them to UserIntent
          if (userIntentState) {
            console.log('[Splash] Resuming UserIntent at step:', userIntentState.step);
            navigate("/user-intent", { replace: true });
            return;
          }

          // If user has incomplete ProfileQuestions state, return them there
          if (profileQuestionsState) {
            console.log('[Splash] Resuming ProfileQuestions at step:', profileQuestionsState.step);
            navigate("/profile-questions", { replace: true });
            return;
          }

          // No incomplete states found - check backend for full user status
          const userData = await userAPI.getProfile();
          
          // Check if user has completed onboarding
          if (userData.onboardingComplete) {
            // User has completed onboarding - Check approval status
            if (userData.accountStatus === 'approved') {
              navigate("/home", { replace: true });
            } else {
              // For any non-approved status (under_review, rejected, suspended, etc)
              // Keep user on waitlist status page
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
          console.error('[Splash] Error loading profile:', error);
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
