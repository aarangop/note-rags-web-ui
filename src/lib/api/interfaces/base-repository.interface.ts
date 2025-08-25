export interface IBaseRepository {
  setAuthToken: (token: string) => void;
  removeAuthToken: () => void;
}
