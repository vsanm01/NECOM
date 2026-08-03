/*!
 * socialLinksConfig.js
 * Drop-in links object for SocialMediaModal.init({ links: ... }).
 *
 * All 30 supported keys are listed below with placeholder URLs.
 * Replace each placeholder with your real profile link.
 * Delete/empty any key you don't use — SocialMediaModal automatically
 * hides any key that's missing or blank.
 */

var socialLinks = {
  websiteSocial:  'https://yourwebsite.com',
  blog:           'https://blog.yourwebsite.com',
  facebook:       'https://facebook.com/yourpage',
  instagram:      'https://instagram.com/yourprofile',
  youtube:        'https://youtube.com/yourchannel',
  tiktok:         'https://tiktok.com/@yourprofile',
  x:              'https://x.com/yourhandle',
  pinterest:      'https://pinterest.com/yourprofile',
  linkedin:       'https://linkedin.com/in/yourprofile',
  whatsappSocial: 'https://wa.me/919876543210',
  telegram:       'https://t.me/yourusername',
  arattai:        'https://arattai.com/yourprofile',
  discord:        'https://discord.gg/yourinvite',
  playstore:      'https://play.google.com/store/apps/details?id=com.your.app',
  googleBusiness: 'https://business.google.com/yourpage',
  wikipedia:      'https://wikipedia.org/wiki/YourPage',
  reddit:         'https://reddit.com/r/yourcommunity',
  quora:          'https://quora.com/profile/yourname',
  wechat:         'https://weixin.qq.com/yourpage',
  snapchat:       'https://snapchat.com/add/yourusername',
  tumblr:         'https://yourusername.tumblr.com',
  threads:        'https://threads.net/@yourusername',
  vk:             'https://vk.com/yourusername',
  ok:             'https://ok.ru/yourprofile',
  kakao:          'https://open.kakao.com/yourinvite',
  viber:          'viber://chat?number=+919876543210',
  threema:        'https://threema.id/yourthreemaid',
  signal:         'https://signal.me/#p/yoursignalid',
  messenger:      'https://m.me/yourusername',
  douyin:         'https://www.douyin.com/user/yourid'
};

// Works both as a plain global (for <script src="socialLinksConfig.js">)
// and as a CommonJS module if you bundle your JS.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = socialLinks;
}
