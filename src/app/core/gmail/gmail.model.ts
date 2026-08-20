export interface GoogleAuthUrl {
  url: string;
}

export interface GmailStatus {
  connected: boolean;
  gmailAddress: string | null;
  watching: boolean;
}
