export {};

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: {
              credential: string;
              select_by: string;
            }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: "signin" | "signup" | "use";
            login_uri?: string;
            native_callback?: () => void;
          }) => void;

          prompt: (
            momentListener?: (notification: {
              isDisplayed(): boolean;
              isNotDisplayed(): boolean;
              getNotDisplayedReason(): string;
              isSkippedMoment(): boolean;
              getSkippedReason(): string;
              isDismissedMoment(): boolean;
              getDismissedReason(): string;
            }) => void,
          ) => void;

          cancel: () => void;
          disableAutoSelect: () => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}
