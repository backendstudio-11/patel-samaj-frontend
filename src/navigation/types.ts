export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  MainTabs: { screen?: string } | undefined;
  
  // Donors
  DonorDetails: { id: string };
  DonorForm: { id?: string } | undefined;
  
  // Events
  EventDetails: { id: string };
  EventForm: { id?: string } | undefined;
  
  // Inventory
  InventoryList: undefined;
  ItemDetails: { id: string };
  ItemForm: { id?: string } | undefined;
  
  // Expenses
  ExpenseDetails: { id: string };
  ExpenseForm: { id?: string } | undefined;
  ExpenseSummary: undefined;
  
  // Profile
  EditProfile: undefined;
  ChangePassword: undefined;
  AdminList: undefined;
  InviteAdmin: undefined;
};
