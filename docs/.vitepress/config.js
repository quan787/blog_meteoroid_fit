import footnote from 'markdown-it-footnote'
import { defineConfig } from 'vitepress'

export default {
    title: 'meteoroid.fit',
    description: 'Just playing around.',
    themeConfig: {
        logo: '/icon.png',
        nav: [
            { text: '模拟器', link: 'http://demo.meteoroid.fit/coverage.html' },
            { text: '全景图', link: 'http://demo.meteoroid.fit/pano/album.html' },
            { text: '文档源码', link: 'https://github.com/quan787/blog_meteoroid_fit' }
        ],
        sidebar: [
            {
                items: [{
                    text: '文档中心',
                    link: '/preface'
                }]
            },
            {
                text: '流星探测理论',
                items: [
                    { text: '前言', link: '/meteor/motivation' },
                    { text: '流星探测原理（1）', link: '/meteor/concepts' },
                    { text: '流星探测原理（2）', link: '/meteor/concepts2' },
                    { text: '世界上的流星监测网', link: '/meteor/networks' },
                    { text: '澳大利亚沙漠火流星监测网', link: '/meteor/DFN' },
                    { text: '光子到电子到数字', link: '/meteor/photon_to_digit' },
                    { text: '网络摄像头的错误设置', link: '/meteor/wrong_settings' },
                    { text: '如何拍到更多流星？', link: '/meteor/camera' }
                ]
            },
            {
                text: '架设流星探测设备',
                items: [
                    { text: '从零到一搭建流星监控设备', link: '/hardware/howto' }
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
                    text: '首页',
                    link: '/index'
                },
                {
                    text: '京ICP备19031740号-2',
                    link: 'https://beian.miit.gov.cn/'
                }]
            }
        ],
        footer: {
            message: '<a href="https://beian.miit.gov.cn/">京ICP备19031740号-2</a>',
            copyright: 'Copyright © 2022-present quan787'
        }
    },
    markdown: {
        config: (md) => {
            md.use(footnote)
        }
    }
}
