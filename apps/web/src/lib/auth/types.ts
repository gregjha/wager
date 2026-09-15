const _AuthActions = ["register", "login"] as const;
const _UserProfileTabs = ["joined", "hosting"] as const;

export type AuthActionType = (typeof _AuthActions)[number];
export type UserProfileTabType = (typeof _UserProfileTabs)[number];
