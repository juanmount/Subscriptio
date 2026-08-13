import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/ui/theme';
import { t } from '@/i18n';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconName, focused: boolean) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconName)}
      size={24}
      color={focused ? Colors.tabActive : Colors.tabInactive}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabActive,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: '#FFFFFF',
          shadowColor: '#6B52E0',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.home'),
          tabBarIcon: ({ focused }) => tabIcon('home', focused),
        }}
      />
      <Tabs.Screen
        name="suscripciones"
        options={{
          title: t('tab.subscriptions'),
          tabBarIcon: ({ focused }) => tabIcon('list', focused),
        }}
      />
      <Tabs.Screen
        name="calendario"
        options={{
          title: t('tab.calendar'),
          tabBarIcon: ({ focused }) => tabIcon('calendar', focused),
        }}
      />
      <Tabs.Screen
        name="tarjetas"
        options={{
          title: t('tab.cards'),
          tabBarIcon: ({ focused }) => tabIcon('card', focused),
        }}
      />
      <Tabs.Screen
        name="mas"
        options={{
          title: t('tab.more'),
          tabBarIcon: ({ focused }) => tabIcon('ellipsis-horizontal', focused),
        }}
      />
      <Tabs.Screen
        name="price-watch"
        options={{
          href: null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
