export {};

declare global {
  type GoogleCredentialResponse = {
    credential: string;
    select_by: string;
  };

  type GoogleButtonConfiguration = {
    type?: "standard" | "icon";
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "small" | "medium" | "large";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    shape?: "rectangular" | "pill" | "circle" | "square";
    width?: number;
  };

  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (configuration: {
            client_id: string;
            callback: (
              response: GoogleCredentialResponse,
            ) => void;
          }) => void;

          renderButton: (
            parent: HTMLElement,
            configuration: GoogleButtonConfiguration,
          ) => void;
        };
      };
    };
  }
}