// PurpleOS Dark Theme Enforcement v1.0
// Include in <head> before any stylesheets on pages using tokens.css
(function () {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.documentElement.style.colorScheme = 'dark';

  window.getPurpleAuthToken = function () {
    return localStorage.getItem('sb-access-token') ||
           localStorage.getItem('gro10x_token') ||
           localStorage.getItem('gro10x_token') ||
           localStorage.getItem('jwt_token') ||
           sessionStorage.getItem('gro10x_token') ||
           '';
  };
}());

