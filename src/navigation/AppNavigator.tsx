import React from 'react';
import { Platform, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { themeColors } from '../theme';
import { RootState } from '../store';
import { RootStackParamList } from './types';
import { useAuthSession } from '../hooks/useAuthSession';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Core Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import DonorListScreen from '../screens/donors/DonorListScreen';
import DonorDetailsScreen from '../screens/donors/DonorDetailsScreen';
import DonorFormScreen from '../screens/donors/DonorFormScreen';

import EventListScreen from '../screens/events/EventListScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';
import EventFormScreen from '../screens/events/EventFormScreen';

import InventoryListScreen from '../screens/inventory/InventoryListScreen';
import ItemDetailsScreen from '../screens/inventory/ItemDetailsScreen';
import ItemFormScreen from '../screens/inventory/ItemFormScreen';

import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import ExpenseDetailsScreen from '../screens/expenses/ExpenseDetailsScreen';
import ExpenseFormScreen from '../screens/expenses/ExpenseFormScreen';
import ExpenseSummaryScreen from '../screens/expenses/ExpenseSummaryScreen';

import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/profile/ChangePasswordScreen';
import { AdminListScreen } from '../screens/profile/AdminListScreen';
import { InviteAdminScreen } from '../screens/profile/InviteAdminScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const DashboardStack = createStackNavigator();
const DashboardStackScreen = () => (
  <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
    <DashboardStack.Screen name="Dashboard" component={DashboardScreen} />
    <DashboardStack.Screen name="InventoryList" component={InventoryListScreen} />
    <DashboardStack.Screen name="ItemDetails" component={ItemDetailsScreen} />
    <DashboardStack.Screen name="ItemForm" component={ItemFormScreen} />
    <DashboardStack.Screen name="DonorDetails" component={DonorDetailsScreen} />
    <DashboardStack.Screen name="DonorForm" component={DonorFormScreen} />
    <DashboardStack.Screen name="EventDetails" component={EventDetailsScreen} />
    <DashboardStack.Screen name="EventForm" component={EventFormScreen} />
    <DashboardStack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
    <DashboardStack.Screen name="ExpenseForm" component={ExpenseFormScreen} />
    <DashboardStack.Screen name="ExpenseSummary" component={ExpenseSummaryScreen} />
  </DashboardStack.Navigator>
);

const DonorsStack = createStackNavigator();
const DonorsStackScreen = () => (
  <DonorsStack.Navigator screenOptions={{ headerShown: false }}>
    <DonorsStack.Screen name="DonorList" component={DonorListScreen} />
    <DonorsStack.Screen name="DonorDetails" component={DonorDetailsScreen} />
    <DonorsStack.Screen name="DonorForm" component={DonorFormScreen} />
  </DonorsStack.Navigator>
);

const EventsStack = createStackNavigator();
const EventsStackScreen = () => (
  <EventsStack.Navigator screenOptions={{ headerShown: false }}>
    <EventsStack.Screen name="EventList" component={EventListScreen} />
    <EventsStack.Screen name="EventDetails" component={EventDetailsScreen} />
    <EventsStack.Screen name="EventForm" component={EventFormScreen} />
  </EventsStack.Navigator>
);

const ExpensesStack = createStackNavigator();
const ExpensesStackScreen = () => (
  <ExpensesStack.Navigator screenOptions={{ headerShown: false }}>
    <ExpensesStack.Screen name="ExpenseList" component={ExpenseListScreen} />
    <ExpensesStack.Screen name="ExpenseDetails" component={ExpenseDetailsScreen} />
    <ExpensesStack.Screen name="ExpenseForm" component={ExpenseFormScreen} />
    <ExpensesStack.Screen name="ExpenseSummary" component={ExpenseSummaryScreen} />
  </ExpensesStack.Navigator>
);

const ProfileStack = createStackNavigator();
const ProfileStackScreen = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <ProfileStack.Screen name="AdminList" component={AdminListScreen} />
    <ProfileStack.Screen name="InviteAdmin" component={InviteAdminScreen} />
  </ProfileStack.Navigator>
);

const renderTabLabel = (title: string, color: string, focused: boolean) => (
  <Text
    style={{
      color,
      fontSize: 11,
      fontWeight: focused ? '700' : '500',
      textAlign: 'center',
      marginTop: 2,
    }}
  >
    {title}
  </Text>
);

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: themeColors.border,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName = '';
          switch (route.name) {
            case 'DashboardTab':
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
              break;
            case 'DonorsTab':
              iconName = focused ? 'hand-heart' : 'hand-heart-outline';
              break;
            case 'EventsTab':
              iconName = focused ? 'calendar-check' : 'calendar-check-outline';
              break;
            case 'ExpensesTab':
              iconName = focused ? 'cash-register' : 'cash-register';
              break;
            case 'ProfileTab':
              iconName = focused ? 'account-circle' : 'account-circle-outline';
              break;
          }
          return <MaterialCommunityIcons name={iconName as any} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackScreen}
        options={{
          tabBarLabel: ({ color, focused }) => renderTabLabel('Dashboard', color, focused),
        }}
      />
      <Tab.Screen
        name="DonorsTab"
        component={DonorsStackScreen}
        options={{
          tabBarLabel: ({ color, focused }) => renderTabLabel('Donors', color, focused),
        }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsStackScreen}
        options={{
          tabBarLabel: ({ color, focused }) => renderTabLabel('Events', color, focused),
        }}
      />
      <Tab.Screen
        name="ExpensesTab"
        component={ExpensesStackScreen}
        options={{
          tabBarLabel: ({ color, focused }) => renderTabLabel('Expenses', color, focused),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: ({ color, focused }) => renderTabLabel('Profile', color, focused),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  useAuthSession();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
