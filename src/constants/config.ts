export const Config = {
  post: {
    maxTitleLength: 50,
    maxContentLength: 1000,
    maxImages: 3,
    maxImageSizeMB: 5,
  },
  comment: {
    maxContentLength: 500,
  },
  inviteCode: {
    length: 8,
    expirationDays: 7,
    maxUses: 10,
  },
  session: {
    expirationDays: 30,
  },
  password: {
    minLength: 8,
  },
};
