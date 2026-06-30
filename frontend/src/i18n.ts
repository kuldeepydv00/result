import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      site_title: 'Result King',
      home: 'Home',
      charts: 'Record Charts',
      search: 'Search',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      admin: 'Admin',
      dashboard: 'Dashboard',
      favorites: 'Favorites',
      profile: 'Profile',
      next_announce: 'NEXT ANNOUNCEMENTS',
      scheduled_at: 'Scheduled at',
      today_results: "Today's Results",
      yesterday_results: "Yesterday's Results",
      select_date: 'Select Date',
      search_placeholder: 'Search game, number, or YYYY-MM-DD...',
      no_results: 'No results found',
      chart_title: 'Monthly Record Chart',
      year: 'Year',
      month: 'Month',
      game: 'Game',
      view_chart: 'View Chart',
      date: 'Date',
      result: 'Result',
      status: 'Status',
      api_source: 'Source',
      manual: 'Manual',
      api: 'API',
      pending: 'Pending',
      announced: 'Announced',
      star_hint: 'Star a game to show it at the top of your list.',
      enable_push: 'Enable Web Push Alerts',
      push_subscribed: 'Subscribed to Alerts',
      push_unsubscribed: 'Push alerts disabled',
      dark_mode: 'Dark Theme',
      light_mode: 'Light Theme',
      record_chart_link: 'Record Chart'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
