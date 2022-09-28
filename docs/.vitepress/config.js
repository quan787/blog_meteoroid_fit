export default {
    title: 'meteoroid.fit',
    description: 'Just playing around.',
    themeConfig: {
        logo: '/icon.png',
        nav: [
            { text: '全景图', link: 'http://demo.meteoroid.fit/pano/album.html' },
            { text: '文档源码', link: 'https://github.com/quan787/blog_meteoroid_fit' }
        ],
        sidebar: [
            {
                text: '流星探测理论',
                items: [
                    //{ text: '前言', link: 'meteor/start' },
                    { text: '流星探测原理（1）', link: 'meteor/concepts' },
                    { text: '流星探测原理（2）', link: 'meteor/concepts2' },
                    { text: '世界上的流星监测网', link: 'meteor/networks' }
                ]
            },
            {
                text: '架设流星探测设备',
                items: [
                    /*{ text: '总体设计', link: 'hardware/overall' }*/
                ]
            },
            {
                text: 'meteoroid.fit网站',
                items: [
                    /*{ text: '注册', link: 'website/register' }*/
                ]
            },

            {
                items: [{
                    text: '京ICP备19031740号-2',
                    link: 'https://beian.miit.gov.cn/'
                }]
            }
        ],
        footer: {
            message: '<a href="https://beian.miit.gov.cn/">京ICP备19031740号-2</a>',
            copyright: 'Copyright © 2022-present quan787'
        }
    }
}
