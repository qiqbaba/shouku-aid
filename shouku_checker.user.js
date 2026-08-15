// ==UserScript==
// @name         收库助手
// @namespace    AI写的（Antigravity）
// @version      1.7
// @description  在收库123导航网页右侧创建一个控制面板，点击后开始检测网页中所有链接的可用性，并做出对应的状态标识。
// @author       AI写的（Antigravity）
// @license      MIT
// @match        *://shouku123.com/*
// @match        *://www.shouku123.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_setClipboard
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // 1. 样式系统
    const styles = `
        /* 控制面板样式 - 现代暗色玻璃拟态 */
        #checker-panel {
            position: fixed;
            top: 100px;
            right: 0px;
            width: 240px;
            max-height: calc(100vh - 40px);
            display: flex;
            flex-direction: column;
            background: rgba(25, 25, 25, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 14px;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 10px 40px rgba(0, 0, 0, 0.5);
            color: #f3f4f6;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            z-index: 999999;
            transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), border-radius 0.3s ease, background 0.3s, box-shadow 0.3s;
            user-select: none;
            overflow: hidden;
        }

        #checker-panel.minimized {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: move;
            background: rgba(30, 30, 30, 0.9);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
            overflow: visible;
        }

        #checker-panel.minimized:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
            background: rgba(40, 40, 40, 0.95);
        }

        /* 运行中的呼吸脉冲发光 */
        #checker-panel.minimized.running {
            animation: checker-min-pulse 1.6s infinite;
        }

        @keyframes checker-min-pulse {
            0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
            100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }

        #checker-panel.minimized * {
            display: none !important;
        }

        #checker-panel.minimized::before {
            content: "🔗";
            font-size: 20px;
            display: block !important;
        }

        /* 最小化状态下的未读异常角标 */
        .checker-min-badge {
            display: none;
        }

        #checker-panel.minimized .checker-min-badge {
            display: flex !important;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: -4px;
            right: -4px;
            background: #ef4444;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 1px 5px;
            min-width: 18px;
            height: 18px;
            border-radius: 9px;
            border: 2px solid #191919;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
            line-height: 1;
            z-index: 10;
        }

        #checker-panel.minimized .checker-min-badge.hidden {
            display: none !important;
        }

        .checker-header {
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            flex-shrink: 0;
        }

        .checker-title {
            font-size: 14px;
            font-weight: 600;
            margin: 0;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .checker-title-badge {
            font-size: 10px;
            font-weight: 500;
            color: #9ca3af;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1px 6px;
            border-radius: 10px;
            letter-spacing: 0.2px;
        }

        .checker-toggle-min {
            cursor: pointer;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background 0.2s;
            font-size: 10px;
            color: #9ca3af;
        }

        .checker-toggle-min:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }

        .checker-body {
            padding: 12px;
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
        }

        /* 极简暗色细滚动条 */
        .checker-body::-webkit-scrollbar {
            width: 4px;
        }
        .checker-body::-webkit-scrollbar-track {
            background: transparent;
        }
        .checker-body::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.18);
            border-radius: 2px;
        }
        .checker-body::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.32);
        }

        /* 控制区与进度条 */
        .checker-control-section {
            margin-bottom: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .checker-actions {
            display: flex;
            gap: 8px;
        }

        .checker-btn {
            flex: 1;
            padding: 7px 10px;
            border: none;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
            text-align: center;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }

        #checker-btn-toggle {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        #checker-btn-toggle:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        #checker-btn-toggle.btn-running {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        #checker-btn-toggle.btn-running:hover {
            box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
        }

        #checker-btn-reset {
            background: rgba(255, 255, 255, 0.08);
            color: #f3f4f6;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        #checker-btn-reset:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        /* 进度条与进度指示 */
        .checker-progress-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .checker-progress-label-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #9ca3af;
        }

        .checker-progress-text {
            font-size: 11px;
            color: #d1d5db;
            font-weight: 500;
        }

        .checker-progress-pct {
            color: #3b82f6;
            font-weight: 600;
            margin-left: 2px;
        }

        .checker-progress-bar-bg {
            height: 5px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
        }

        .checker-progress-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #3b82f6, #10b981);
            transition: width 0.3s ease;
        }

        /* 滑块 */
        .checker-slider-container {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .checker-slider-label {
            font-size: 11px;
            color: #9ca3af;
            display: flex;
            justify-content: space-between;
        }

        .checker-slider {
            -webkit-appearance: none;
            width: 100%;
            height: 4px;
            border-radius: 2px;
            background: rgba(255, 255, 255, 0.15);
            outline: none;
        }

        .checker-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            transition: transform 0.1s;
        }

        .checker-slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
        }

        /* 网址搜索框 */
        .checker-search-container {
            position: relative;
            margin-bottom: 8px;
        }

        .checker-search-input {
            width: 100%;
            box-sizing: border-box;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: #ffffff;
            padding: 5px 24px 5px 8px;
            font-size: 11px;
            outline: none;
            transition: all 0.2s ease;
        }

        .checker-search-input:focus {
            background: rgba(255, 255, 255, 0.1);
            border-color: #3b82f6;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.25);
        }

        .checker-search-input::placeholder {
            color: #6b7280;
            font-size: 11px;
        }

        .checker-search-clear {
            position: absolute;
            right: 6px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 10px;
            color: #9ca3af;
            cursor: pointer;
            display: none;
            line-height: 1;
            padding: 2px;
            transition: color 0.2s;
        }

        .checker-search-clear.show {
            display: block;
        }

        .checker-search-clear:hover {
            color: #ffffff;
        }

        /* 状态分类网格 (7 种状态) */
        .checker-stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
            margin-bottom: 8px;
        }

        .checker-stat-item {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 8px;
            padding: 4px 7px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            min-width: 0;
        }

        /* 状态微型彩色圆点 */
        .checker-stat-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 4px;
            flex-shrink: 0;
        }

        .stat-dot-pending { background-color: #9ca3af; }
        .stat-dot-checking { background-color: #3b82f6; }
        .stat-dot-success { background-color: #10b981; }
        .stat-dot-warning { background-color: #f59e0b; }
        .stat-dot-error { background-color: #ef4444; }
        .stat-dot-ratelimit { background-color: #f97316; }
        .stat-dot-github { background-color: #38bdf8; }

        /* 可选中的统计项 */
        .checker-stat-item.selectable {
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        }

        .checker-stat-item.selectable:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .checker-stat-item.selectable.selected {
            background: rgba(255, 255, 255, 0.08);
        }

        /* 选中态定制光晕与边框色 */
        .checker-stat-item.selectable[data-status="pending"].selected { border-color: rgba(156, 163, 175, 0.4); }
        .checker-stat-item.selectable[data-status="checking"].selected { border-color: rgba(59, 130, 246, 0.4); }
        .checker-stat-item.selectable[data-status="success"].selected { border-color: rgba(16, 185, 129, 0.45); box-shadow: 0 0 6px rgba(16, 185, 129, 0.15); }
        .checker-stat-item.selectable[data-status="warning"].selected { border-color: rgba(245, 158, 11, 0.45); box-shadow: 0 0 6px rgba(245, 158, 11, 0.15); }
        .checker-stat-item.selectable[data-status="error"].selected { border-color: rgba(239, 68, 68, 0.45); box-shadow: 0 0 6px rgba(239, 68, 68, 0.15); }
        .checker-stat-item.selectable[data-status="ratelimit"].selected { border-color: rgba(249, 115, 22, 0.45); box-shadow: 0 0 6px rgba(249, 115, 22, 0.15); }
        .checker-stat-item.selectable[data-status="github"].selected { border-color: rgba(56, 189, 248, 0.45); box-shadow: 0 0 6px rgba(56, 189, 248, 0.15); }

        .checker-stat-item.selectable:not(.selected) {
            opacity: 0.45;
        }

        .checker-stat-item.selectable.selected::after {
            content: "✓";
            position: absolute;
            top: 1px;
            right: 3px;
            font-size: 8px;
            color: rgba(255, 255, 255, 0.45);
        }

        .checker-stat-label {
            font-size: 11px;
            color: #9ca3af;
            display: flex;
            align-items: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .checker-stat-val {
            font-size: 13px;
            font-weight: 700;
            margin-left: 4px;
            flex-shrink: 0;
        }

        .stat-pending { color: #9ca3af; }
        .stat-checking { color: #3b82f6; }
        .stat-success { color: #10b981; }
        .stat-warning { color: #f59e0b; }
        .stat-error { color: #ef4444; }
        .stat-ratelimit { color: #f97316; }
        .stat-github { color: #38bdf8; }
        .stat-duplicate { color: #a78bfa; }

        /* 快捷筛选与重复项操作行 */
        .checker-filter-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            gap: 4px;
        }

        .checker-dup-filter-btn {
            font-size: 10px;
            color: #a78bfa;
            background: rgba(167, 139, 250, 0.08);
            border: 1px solid rgba(167, 139, 250, 0.18);
            border-radius: 5px;
            padding: 2px 6px;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 3px;
            white-space: nowrap;
        }

        .checker-dup-filter-btn.selected {
            background: rgba(167, 139, 250, 0.25);
            border-color: rgba(167, 139, 250, 0.45);
            color: #ffffff;
        }

        .checker-dup-filter-btn:not(.selected) {
            opacity: 0.55;
        }

        .checker-dup-filter-btn:hover {
            opacity: 1;
        }

        .checker-filter-actions {
            display: flex;
            gap: 4px;
            align-items: center;
        }

        .checker-filter-action-btn {
            font-size: 10px;
            color: #9ca3af;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 4px;
            padding: 2px 5px;
            transition: all 0.2s;
            white-space: nowrap;
        }

        .checker-filter-action-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
        }

        .checker-filter-action-btn.btn-failed-only {
            color: #fca5a5;
            background: rgba(239, 68, 68, 0.12);
            border-color: rgba(239, 68, 68, 0.25);
        }

        .checker-filter-action-btn.btn-failed-only:hover {
            background: rgba(239, 68, 68, 0.22);
            color: #ffffff;
        }

        /* 一键打开与实用处理容器 */
        .checker-open-container {
            margin-bottom: 10px;
            display: flex;
            flex-direction: column;
            gap: 7px;
            padding-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .checker-open-settings {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .checker-input-num {
            width: 48px;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 6px;
            color: #ffffff;
            padding: 3px 6px;
            font-size: 11px;
            text-align: center;
            outline: none;
            transition: border-color 0.2s;
        }

        .checker-input-num:focus {
            border-color: #8b5cf6;
        }

        #checker-btn-open-failed {
            background: linear-gradient(135deg, #8b5cf6, #6d28d9);
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        #checker-btn-open-failed:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
        }

        #checker-btn-open-failed:active {
            transform: translateY(0);
        }

        #checker-btn-open-failed:disabled {
            background: rgba(255, 255, 255, 0.05);
            color: #6b7280;
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: none;
            cursor: not-allowed;
            transform: none;
        }

        /* 次级实用按钮栏（复制列表 / 定位） */
        .checker-sub-actions {
            display: flex;
            gap: 6px;
        }

        .checker-btn-sub {
            flex: 1;
            padding: 5px 6px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.09);
            color: #d1d5db;
            transition: all 0.2s;
            text-align: center;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        }

        .checker-btn-sub:hover:not(:disabled) {
            background: rgba(255, 255, 255, 0.12);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.2);
        }

        .checker-btn-sub:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        /* 网页中的指示器小圆点 */
        .checker-badge {
            display: inline-block;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            margin-left: 6px;
            vertical-align: middle;
            position: relative;
            cursor: help;
            transition: all 0.3s ease;
        }

        .checker-badge.badge-pending {
            background-color: #9ca3af;
            box-shadow: 0 0 4px rgba(156, 163, 175, 0.6);
        }

        .checker-badge.badge-checking {
            background-color: #3b82f6;
            box-shadow: 0 0 8px #3b82f6;
            animation: checker-pulse 1.2s infinite;
        }

        .checker-badge.badge-success {
            background-color: #10b981;
            box-shadow: 0 0 6px #10b981;
        }

        .checker-badge.badge-warning {
            background-color: #f59e0b;
            box-shadow: 0 0 6px #f59e0b;
        }

        .checker-badge.badge-error {
            background-color: #ef4444;
            box-shadow: 0 0 8px #ef4444;
            animation: checker-pulse-red 1.5s infinite;
        }

        .checker-badge.badge-ratelimit {
            background-color: #f97316;
            box-shadow: 0 0 6px #f97316;
        }

        .checker-badge.badge-github {
            background-color: #38bdf8;
            box-shadow: 0 0 6px #38bdf8;
        }

        @keyframes checker-pulse {
            0% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(1); opacity: 0.6; }
        }

        @keyframes checker-pulse-red {
            0% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 0.8; }
        }

        /* 已打开的徽章不透明度降低 */
        .checker-badge.badge-opened {
            opacity: 0.35;
        }

        /* 热度微型胶囊 */
        .checker-hot-badge {
            display: inline-flex;
            align-items: center;
            font-size: 10px;
            color: #ff5f1f;
            background: rgba(255, 95, 31, 0.08);
            border: 1px solid rgba(255, 95, 31, 0.15);
            border-radius: 4px;
            padding: 1px 4px;
            margin-right: 6px;
            font-weight: 600;
            vertical-align: middle;
            pointer-events: none;
            transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .checker-hot-badge.hidden {
            display: none !important;
        }

        /* 重复网址标签 */
        .checker-dup-badge {
            display: inline-flex;
            align-items: center;
            font-size: 10px;
            color: #a78bfa;
            background: rgba(167, 139, 250, 0.08);
            border: 1px solid rgba(167, 139, 250, 0.15);
            border-radius: 4px;
            padding: 1px 4px;
            margin-right: 6px;
            font-weight: 600;
            vertical-align: middle;
            pointer-events: none;
        }

        /* 解决长标题截断导致指示器和热度隐藏的问题 */
        .url-title {
            display: inline-flex !important;
            align-items: center;
        }
        .myGotoUrl {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex-shrink: 1;
        }
        .url-title > span {
            flex-shrink: 0;
        }

        /* 强制单行 Flex 布局，防止浮动导致热度和按钮换行 */
        li.list-group-item {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            transition: background-color 0.4s ease, border-color 0.4s ease;
        }
        li.list-group-item .pull-left {
            float: none !important;
            flex: 1 !important;
            min-width: 0 !important;
            width: auto !important;
        }
        li.list-group-item .pull-right {
            float: none !important;
            flex-shrink: 0 !important;
            display: inline-flex !important;
            align-items: center !important;
        }
        li.list-group-item .clearfix {
            display: none !important;
        }

        /* 目标链接高亮闪烁动画 */
        @keyframes checker-highlight-flash {
            0% { background-color: rgba(239, 68, 68, 0.28); }
            50% { background-color: rgba(245, 158, 11, 0.18); }
            100% { background-color: transparent; }
        }

        li.list-group-item.checker-target-highlight {
            animation: checker-highlight-flash 2s ease;
            outline: 2px solid #ef4444 !important;
            outline-offset: -1px;
        }

        /* 手风琴折叠卡片（其他设置） */
        .checker-accordion {
            margin-top: 10px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            padding-top: 6px;
        }

        .checker-accordion-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            padding: 4px 2px;
            color: #9ca3af;
            font-size: 11px;
            font-weight: 600;
            user-select: none;
            transition: color 0.2s;
        }

        .checker-accordion-header:hover {
            color: #e5e7eb;
        }

        .checker-accordion-arrow {
            font-size: 9px;
            transition: transform 0.25s ease;
        }

        .checker-accordion.open .checker-accordion-arrow {
            transform: rotate(90deg);
        }

        .checker-accordion-body {
            display: none;
            padding-top: 8px;
            flex-direction: column;
            gap: 8px;
        }

        .checker-accordion.open .checker-accordion-body {
            display: flex;
        }

        /* 过滤开关 */
        .checker-switch-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .checker-switch-label {
            font-size: 11px;
            color: #9ca3af;
        }

        .checker-switch {
            position: relative;
            display: inline-block;
            width: 36px;
            height: 18px;
        }

        .checker-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .checker-slider-round {
            position: absolute;
            cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background-color: rgba(255, 255, 255, 0.15);
            transition: .3s;
            border-radius: 18px;
        }

        .checker-slider-round:before {
            position: absolute;
            content: "";
            height: 12px;
            width: 12px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s;
            border-radius: 50%;
        }

        .checker-switch input:checked + .checker-slider-round {
            background-color: #ef4444;
        }

        .checker-switch input:checked + .checker-slider-round:before {
            transform: translateX(18px);
        }

        .checker-select {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 6px;
            color: #ffffff;
            padding: 2px 6px;
            font-size: 11px;
            outline: none;
            transition: border-color 0.2s;
            cursor: pointer;
        }

        .checker-select:focus {
            border-color: #8b5cf6;
        }

        .checker-select option {
            background: #1e1e1e;
            color: #ffffff;
        }

        li.list-group-item.checker-filtered-hidden {
            display: none !important;
        }

        /* 检测时间（不显眼的页脚小字） */
        .checker-time-footer {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            font-size: 10px;
            color: #6b7280;
            text-align: right;
            letter-spacing: 0.3px;
        }

        /* 复制/提示 Toast 消息 */
        .checker-toast {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            background: rgba(20, 20, 20, 0.95);
            color: #f3f4f6;
            border: 1px solid rgba(255, 255, 255, 0.15);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(8px);
            z-index: 1000000;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            pointer-events: none;
        }

        .checker-toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }

        /* 暗色模式样式 */
        html.checker-dark-mode {
            background-color: #ffffff !important;
            filter: invert(1) hue-rotate(180deg) !important;
        }

        /* 在暗色模式下，去除 body 的背景图，并使用纯色背景（经滤镜反色后呈现为黑色） */
        html.checker-dark-mode body {
            background-image: none !important;
            background-color: #ffffff !important;
        }

        /* 针对图片、视频、二维码、iframe、收库助手面板、状态指示灯以及页面标题进行反向过滤以恢复原样 */
        html.checker-dark-mode img,
        html.checker-dark-mode video,
        html.checker-dark-mode iframe,
        html.checker-dark-mode canvas,
        html.checker-dark-mode [style*="background-image"],
        html.checker-dark-mode .checker-badge,
        html.checker-dark-mode .checker-hot-badge,
        html.checker-dark-mode .checker-dup-badge,
        html.checker-dark-mode #checker-panel,
        html.checker-dark-mode .checker-toast,
        html.checker-dark-mode .glyphicon-qrcode,
        html.checker-dark-mode .top-div .text-center .user-settings {
            filter: invert(1) hue-rotate(180deg) !important;
        }
    `;

    // 插入 CSS 样式
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // 2. 初始化核心状态与链接解析
    let items = [];
    let queue = [];
    let isRunning = false;
    let lastHighlightIndex = -1;
    let searchKeyword = '';

    // 从 localStorage 加载设置，没有则使用默认值
    let maxConcurrency = parseInt(localStorage.getItem('checker-panel-concurrency') || '5', 10);
    // 状态过滤：选中的状态才显示，默认选中 warning, error, ratelimit, github
    let selectedStatuses = new Set(JSON.parse(localStorage.getItem('checker-panel-selected-statuses') || '["pending","checking","warning","error","ratelimit","github"]'));
    // 一次性迁移：为旧版本用户默认选中新增的"GitHub 异常"与"Cloudflare 限流"分类
    if (localStorage.getItem('checker-panel-settings-version') !== '4') {
        selectedStatuses.add('ratelimit');
        selectedStatuses.add('github');
        localStorage.setItem('checker-panel-selected-statuses', JSON.stringify([...selectedStatuses]));
        localStorage.setItem('checker-panel-settings-version', '4');
    }
    let openBatchSize = parseInt(localStorage.getItem('checker-panel-open-batch') || '5', 10);
    let isMinimized = localStorage.getItem('checker-panel-minimized') === 'true';
    let showHotness = localStorage.getItem('checker-panel-show-hotness') !== 'false';
    let hotFilterType = localStorage.getItem('checker-panel-hot-filter-type') || 'none';
    let hotFilterVal = parseInt(localStorage.getItem('checker-panel-hot-filter-val') || '1000', 10);
    let darkMode = localStorage.getItem('checker-panel-dark-mode') === 'true';
    let showDuplicatesOnly = localStorage.getItem('checker-panel-duplicates-only') === 'true';
    let isSettingsOpen = localStorage.getItem('checker-panel-settings-open') === 'true';

    // 尽早应用暗色模式，防止页面闪烁
    if (darkMode) {
        document.documentElement.classList.add('checker-dark-mode');
    }

    let stats = { total: 0, pending: 0, checking: 0, success: 0, warning: 0, error: 0, ratelimit: 0, github: 0, duplicate: 0 };

    // 提取并加载所有需要检测的链接
    function parseLinks() {
        items = [];
        // 清理已存在的指示器与热度标签
        document.querySelectorAll('.checker-badge').forEach(el => el.remove());
        document.querySelectorAll('.checker-hot-badge').forEach(el => el.remove());

        document.querySelectorAll('li.list-group-item').forEach(li => {
            // 优先解析二维码 span 中的真实 URL
            const qrSpan = li.querySelector('span.glyphicon-qrcode');
            let url = null;
            if (qrSpan) {
                const onclickText = qrSpan.getAttribute('onclick') || '';
                const match = onclickText.match(/qrShow\s*\(\s*(['"])(.*?)\1\s*,\s*(['"])(.*?)\3/);
                if (match && match[4]) {
                    url = match[4];
                }
            }

            // 如果没有二维码，使用 a 链接的 href
            if (!url) {
                const aLink = li.querySelector('a.myGotoUrl');
                if (aLink) {
                    url = aLink.getAttribute('href');
                    if (url && !url.startsWith('http')) {
                        url = window.location.origin + url;
                    }
                }
            }

            // 构造对象
            if (url) {
                const aLink = li.querySelector('a.myGotoUrl');
                if (aLink) {
                    const badge = document.createElement('span');
                    badge.className = 'checker-badge badge-pending';
                    badge.title = '等待检测';
                    aLink.parentNode.appendChild(badge);

                    // 提取热度值
                    const titleText = li.getAttribute('title') || '';
                    const hotMatch = titleText.match(/热度\s*[:：]\s*(\d+)/);
                    const hotValue = hotMatch ? hotMatch[1] : null;
                    const hotnessNum = hotValue ? parseInt(hotValue, 10) : 0;
                    let hotBadge = null;

                    if (hotValue) {
                        hotBadge = document.createElement('span');
                        hotBadge.className = `checker-hot-badge${showHotness ? '' : ' hidden'}`;
                        const num = parseInt(hotValue, 10);
                        const displayVal = num >= 10000 ? (num / 10000).toFixed(1) + 'w' : hotValue;
                        hotBadge.innerHTML = `🔥 ${displayVal}`;

                        const pullRight = li.querySelector('.pull-right');
                        if (pullRight) {
                            pullRight.insertBefore(hotBadge, pullRight.firstChild);
                        } else {
                            aLink.parentNode.appendChild(hotBadge);
                        }
                    }

                    items.push({
                        li: li,
                        a: aLink,
                        url: url,
                        badge: badge,
                        hotBadge: hotBadge,
                        status: 'pending',
                        detail: '',
                        opened: false,
                        duplicate: false,
                        checkedAt: null,
                        hotness: hotnessNum
                    });
                }
            }
        });

        // 检测重复网址（URL 规范化后比较）
        const urlGroups = {};
        items.forEach(item => {
            const key = normalizeUrl(item.url);
            if (!urlGroups[key]) urlGroups[key] = [];
            urlGroups[key].push(item);
        });
        Object.keys(urlGroups).forEach(key => {
            const group = urlGroups[key];
            if (group.length > 1) {
                group.forEach(item => {
                    item.duplicate = true;
                    const dupBadge = document.createElement('span');
                    dupBadge.className = 'checker-dup-badge';
                    const others = group.filter(o => o !== item);
                    const otherTitles = others
                        .map(o => (o.a.innerText || o.a.title || o.url).trim())
                        .slice(0, 3)
                        .join('\n');
                    dupBadge.title = `重复网址（共 ${group.length} 个）\n其他重复链接:\n${otherTitles}${others.length > 3 ? '\n...' : ''}`;
                    dupBadge.innerText = `⧉ 重复${group.length > 2 ? '×' + group.length : ''}`;
                    const pullRight = item.li.querySelector('.pull-right');
                    if (pullRight) {
                        pullRight.insertBefore(dupBadge, pullRight.firstChild);
                    } else {
                        item.a.parentNode.appendChild(dupBadge);
                    }
                });
            }
        });

        // 初始化统计
        stats = {
            total: items.length,
            pending: items.length,
            checking: 0,
            success: 0,
            warning: 0,
            error: 0,
            ratelimit: 0,
            github: 0,
            duplicate: items.filter(i => i.duplicate).length
        };
    }

    // 3. 构建控制面板 UI
    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'checker-panel';
        if (isMinimized) {
            panel.classList.add('minimized');
        }

        panel.innerHTML = `
            <div class="checker-min-badge hidden" id="checker-min-badge" title="当前未处理异常链接数">0</div>
            <div class="checker-header">
                <div class="checker-title">
                    <span>⚡ 收库助手</span>
                    <span class="checker-title-badge" id="checker-title-total" title="当前页面总链接数">共 0 条</span>
                </div>
                <div class="checker-toggle-min" id="checker-toggle-min" title="收起/展开">➖</div>
            </div>
            <div class="checker-body">
                <!-- 顶部主控区 -->
                <div class="checker-control-section">
                    <div class="checker-actions">
                        <button class="checker-btn" id="checker-btn-toggle">开始检测</button>
                        <button class="checker-btn" id="checker-btn-reset">重置</button>
                    </div>

                    <div class="checker-progress-container">
                        <div class="checker-progress-label-row">
                            <span>检测进度</span>
                            <span class="checker-progress-text">
                                <span id="stat-checked-count">0</span> / <span id="stat-total">0</span>
                                <span class="checker-progress-pct" id="checker-progress-pct">(0%)</span>
                            </span>
                        </div>
                        <div class="checker-progress-bar-bg">
                            <div class="checker-progress-bar-fill" id="checker-progress-fill"></div>
                        </div>
                    </div>

                    <div class="checker-slider-container">
                        <div class="checker-slider-label">
                            <span>并发线程数</span>
                            <span id="checker-slider-val">${maxConcurrency}</span>
                        </div>
                        <input type="range" class="checker-slider" id="checker-slider" min="1" max="10" value="${maxConcurrency}">
                    </div>
                </div>

                <!-- 关键词搜索框 -->
                <div class="checker-search-container">
                    <input type="text" class="checker-search-input" id="checker-search-input" placeholder="🔍 搜索网站名称或网址..." value="${searchKeyword}">
                    <span class="checker-search-clear${searchKeyword ? ' show' : ''}" id="checker-search-clear" title="清空搜索">✖</span>
                </div>

                <!-- 状态分类看板 (7 种真实状态) -->
                <div class="checker-stats-grid">
                    <div class="checker-stat-item selectable${selectedStatuses.has('pending') ? ' selected' : ''}" data-status="pending">
                        <span class="checker-stat-label"><i class="checker-stat-dot stat-dot-pending"></i>待检测</span>
                        <span class="checker-stat-val stat-pending" id="stat-pending">0</span>
                    </div>
                    <div class="checker-stat-item selectable${selectedStatuses.has('checking') ? ' selected' : ''}" data-status="checking">
                        <span class="checker-stat-label"><i class="checker-stat-dot stat-dot-checking"></i>检测中</span>
                        <span class="checker-stat-val stat-checking" id="stat-checking">0</span>
                    </div>
                    <div class="checker-stat-item selectable${selectedStatuses.has('success') ? ' selected' : ''}" data-status="success" title="2xx">
                        <span class="checker-stat-label"><i class="checker-stat-dot stat-dot-success"></i>正常</span>
                        <span class="checker-stat-val stat-success" id="stat-success">0</span>
                    </div>
                    <div class="checker-stat-item selectable${selectedStatuses.has('warning') ? ' selected' : ''}" data-status="warning" title="4xx/5xx">
                        <span class="checker-stat-label"><i class="checker-stat-dot stat-dot-warning"></i>异常</span>
                        <span class="checker-stat-val stat-warning" id="stat-warning">0</span>
                    </div>
                    <div class="checker-stat-item selectable${selectedStatuses.has('error') ? ' selected' : ''}" data-status="error" title="无法连接/超时">
                        <span class="checker-stat-label"><i class="checker-stat-dot stat-dot-error"></i>失效</span>
                        <span class="checker-stat-val stat-error" id="stat-error">0</span>
                    </div>
                    <div class="checker-stat-item selectable${selectedStatuses.has('ratelimit') ? ' selected' : ''}" data-status="ratelimit" title="HTTP 429 Cloudflare 限流">
                        <span class="checker-stat-label"><i class="checker-stat-dot stat-dot-ratelimit"></i>CF 限流</span>
                        <span class="checker-stat-val stat-ratelimit" id="stat-ratelimit">0</span>
                    </div>
                    <div class="checker-stat-item selectable${selectedStatuses.has('github') ? ' selected' : ''}" data-status="github" title="GitHub 异常 (国内网络受限，不代表仓库失效)">
                        <span class="checker-stat-label"><i class="checker-stat-dot stat-dot-github"></i>GitHub 异常</span>
                        <span class="checker-stat-val stat-github" id="stat-github">0</span>
                    </div>
                </div>

                <!-- 独立重复筛选与快捷操作栏 -->
                <div class="checker-filter-bar">
                    <div class="checker-dup-filter-btn${showDuplicatesOnly ? ' selected' : ''}" id="checker-filter-duplicate" title="仅查看重复网址">
                        <span>⧉ 重复</span>
                        <b id="stat-duplicate">0</b>
                    </div>
                    <div class="checker-filter-actions">
                        <button class="checker-filter-action-btn btn-failed-only" id="checker-select-failed-only" title="一键仅查看异常、失效、限流及 GitHub 异常">仅看异常</button>
                        <button class="checker-filter-action-btn" id="checker-select-all" title="全选所有分类">全选</button>
                        <button class="checker-filter-action-btn" id="checker-deselect-all" title="取消所有状态分类">取消</button>
                    </div>
                </div>

                <!-- 批量打开与实用操作区 -->
                <div class="checker-open-container">
                    <div class="checker-open-settings">
                        <span class="checker-switch-label">每次打开数量</span>
                        <input type="number" id="checker-open-limit" class="checker-input-num" min="1" max="100" value="${openBatchSize}" title="每次点击打开的链接数量">
                    </div>
                    <button class="checker-btn" id="checker-btn-open-failed" disabled>
                        打开异常/失效网站 (<span id="checker-open-remaining">0</span>)
                    </button>
                    <div class="checker-sub-actions">
                        <button class="checker-btn-sub" id="checker-btn-copy-failed" title="复制当前所有异常/失效链接的名称与 URL">
                            📋 复制异常
                        </button>
                        <button class="checker-btn-sub" id="checker-btn-jump-next" title="滚动定位到下一个异常链接处">
                            🎯 定位异常
                        </button>
                    </div>
                </div>

                <!-- 其他设置（手风琴折叠卡片，默认收起） -->
                <div class="checker-accordion${isSettingsOpen ? ' open' : ''}" id="checker-settings-accordion">
                    <div class="checker-accordion-header" id="checker-settings-toggle">
                        <span>⚙️ 其他设置</span>
                        <span class="checker-accordion-arrow">▶</span>
                    </div>
                    
                    <div class="checker-accordion-body">
                        <div class="checker-switch-container">
                            <span class="checker-switch-label">显示链接热度</span>
                            <label class="checker-switch">
                                <input type="checkbox" id="checker-hot-switch" ${showHotness ? 'checked' : ''}>
                                <span class="checker-slider-round"></span>
                            </label>
                        </div>

                        <div class="checker-switch-container">
                            <span class="checker-switch-label">开启暗色模式</span>
                            <label class="checker-switch">
                                <input type="checkbox" id="checker-dark-switch" ${darkMode ? 'checked' : ''}>
                                <span class="checker-slider-round"></span>
                            </label>
                        </div>

                        <div class="checker-filter-hot-container" style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span class="checker-switch-label">热度过滤</span>
                                <select id="checker-hot-filter-type" class="checker-select">
                                    <option value="none" ${hotFilterType === 'none' ? 'selected' : ''}>不限</option>
                                    <option value="less" ${hotFilterType === 'less' ? 'selected' : ''}>小于 (&lt;)</option>
                                    <option value="gte" ${hotFilterType === 'gte' ? 'selected' : ''}>大于等于 (&gt;=)</option>
                                </select>
                            </div>
                            <div id="checker-hot-filter-val-row" style="display: ${hotFilterType === 'none' ? 'none' : 'flex'}; align-items: center; justify-content: space-between; gap: 8px;">
                                <span class="checker-switch-label">热度阈值</span>
                                <input type="number" id="checker-hot-filter-val" class="checker-input-num" min="0" value="${hotFilterVal}" style="width: 72px;" placeholder="数值">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="checker-time-footer" id="checker-last-time">检测时间: —</div>
            </div>
        `;

        document.body.appendChild(panel);

        // 恢复保存的位置并初始化拖拽
        restorePosition(panel);
        initDrag(panel);

        // 绑定 UI 事件
        const toggleMinBtn = panel.querySelector('#checker-toggle-min');
        toggleMinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.add('minimized');
            localStorage.setItem('checker-panel-minimized', 'true');
        });

        panel.addEventListener('click', () => {
            if (panel.classList.contains('minimized')) {
                panel.classList.remove('minimized');
                localStorage.setItem('checker-panel-minimized', 'false');
            }
        });

        // 搜索框事件绑定
        const searchInput = panel.querySelector('#checker-search-input');
        const searchClear = panel.querySelector('#checker-search-clear');
        let searchDebounceTimer = null;

        if (searchInput && searchClear) {
            const handleSearch = (val) => {
                searchKeyword = val.trim();
                if (searchKeyword) {
                    searchClear.classList.add('show');
                } else {
                    searchClear.classList.remove('show');
                }
                applyFilterAll();
                updateStatsUI();
            };

            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(() => {
                    handleSearch(e.target.value);
                }, 150);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    handleSearch('');
                }
            });

            searchClear.addEventListener('click', (e) => {
                e.stopPropagation();
                searchInput.value = '';
                handleSearch('');
                searchInput.focus();
            });
        }

        // 滑动条事件
        const slider = panel.querySelector('#checker-slider');
        const sliderVal = panel.querySelector('#checker-slider-val');
        slider.addEventListener('input', (e) => {
            maxConcurrency = parseInt(e.target.value, 10);
            sliderVal.innerText = maxConcurrency;
            localStorage.setItem('checker-panel-concurrency', maxConcurrency);

            // 动态调节并发：如果正在运行且增大了并发，补充 worker
            if (isRunning) {
                adjustWorkers();
            }
        });

        // 统计项点击筛选事件
        panel.querySelectorAll('.checker-stat-item.selectable').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const status = el.dataset.status;
                if (selectedStatuses.has(status)) {
                    selectedStatuses.delete(status);
                    el.classList.remove('selected');
                } else {
                    selectedStatuses.add(status);
                    el.classList.add('selected');
                }
                localStorage.setItem('checker-panel-selected-statuses', JSON.stringify([...selectedStatuses]));
                applyFilterAll();
                updateStatsUI();
            });
        });

        // 独立重复筛选标签事件
        const dupFilterBtn = panel.querySelector('#checker-filter-duplicate');
        if (dupFilterBtn) {
            dupFilterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showDuplicatesOnly = !showDuplicatesOnly;
                dupFilterBtn.classList.toggle('selected', showDuplicatesOnly);
                localStorage.setItem('checker-panel-duplicates-only', showDuplicatesOnly);
                applyFilterAll();
                updateStatsUI();
            });
        }

        // 快捷筛选：仅看异常
        const selectFailedOnlyBtn = panel.querySelector('#checker-select-failed-only');
        if (selectFailedOnlyBtn) {
            selectFailedOnlyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedStatuses.clear();
                ['warning', 'error', 'ratelimit', 'github'].forEach(s => selectedStatuses.add(s));
                panel.querySelectorAll('.checker-stat-item.selectable').forEach(el => {
                    const st = el.dataset.status;
                    if (selectedStatuses.has(st)) {
                        el.classList.add('selected');
                    } else {
                        el.classList.remove('selected');
                    }
                });
                localStorage.setItem('checker-panel-selected-statuses', JSON.stringify([...selectedStatuses]));
                applyFilterAll();
                updateStatsUI();
                showToast("已筛选展示所有异常/失效链接");
            });
        }

        // 全选按钮
        panel.querySelector('#checker-select-all').addEventListener('click', (e) => {
            e.stopPropagation();
            ['pending', 'checking', 'success', 'warning', 'error', 'ratelimit', 'github'].forEach(s => selectedStatuses.add(s));
            panel.querySelectorAll('.checker-stat-item.selectable').forEach(el => {
                el.classList.add('selected');
            });
            localStorage.setItem('checker-panel-selected-statuses', JSON.stringify([...selectedStatuses]));
            applyFilterAll();
            updateStatsUI();
        });

        // 取消全选按钮
        panel.querySelector('#checker-deselect-all').addEventListener('click', (e) => {
            e.stopPropagation();
            selectedStatuses.clear();
            panel.querySelectorAll('.checker-stat-item.selectable').forEach(el => {
                el.classList.remove('selected');
            });
            localStorage.setItem('checker-panel-selected-statuses', JSON.stringify([...selectedStatuses]));
            applyFilterAll();
            updateStatsUI();
        });

        // 手风琴折叠/展开“其他设置”
        const settingsAccordion = panel.querySelector('#checker-settings-accordion');
        const settingsToggle = panel.querySelector('#checker-settings-toggle');
        if (settingsToggle && settingsAccordion) {
            settingsToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                settingsAccordion.classList.toggle('open');
                isSettingsOpen = settingsAccordion.classList.contains('open');
                localStorage.setItem('checker-panel-settings-open', isSettingsOpen);
            });
        }

        // 热度开关事件
        const hotSwitch = panel.querySelector('#checker-hot-switch');
        hotSwitch.addEventListener('change', (e) => {
            showHotness = e.target.checked;
            localStorage.setItem('checker-panel-show-hotness', showHotness);
            applyHotnessVisibility();
        });

        // 暗色模式开关事件
        const darkSwitch = panel.querySelector('#checker-dark-switch');
        darkSwitch.addEventListener('change', (e) => {
            darkMode = e.target.checked;
            localStorage.setItem('checker-panel-dark-mode', darkMode);
            if (darkMode) {
                document.documentElement.classList.add('checker-dark-mode');
            } else {
                document.documentElement.classList.remove('checker-dark-mode');
            }
        });

        // 热度过滤类型变化事件
        const hotFilterTypeSelect = panel.querySelector('#checker-hot-filter-type');
        const hotFilterValRow = panel.querySelector('#checker-hot-filter-val-row');
        const hotFilterValInput = panel.querySelector('#checker-hot-filter-val');

        hotFilterTypeSelect.addEventListener('change', (e) => {
            hotFilterType = e.target.value;
            localStorage.setItem('checker-panel-hot-filter-type', hotFilterType);

            if (hotFilterType === 'none') {
                hotFilterValRow.style.display = 'none';
            } else {
                hotFilterValRow.style.display = 'flex';
            }
            applyFilterAll();
        });

        // 应用热度过滤的统一函数
        const applyHotFilter = () => {
            let val = parseInt(hotFilterValInput.value, 10);
            if (isNaN(val) || val < 0) {
                val = 0;
            }
            hotFilterVal = val;
            localStorage.setItem('checker-panel-hot-filter-val', hotFilterVal);
            applyFilterAll();
        };

        // 热度数值即时防抖生效 (无需额外点击确定按钮)
        let hotDebounceTimer = null;
        if (hotFilterValInput) {
            hotFilterValInput.addEventListener('input', () => {
                clearTimeout(hotDebounceTimer);
                hotDebounceTimer = setTimeout(applyHotFilter, 300);
            });
            hotFilterValInput.addEventListener('change', applyHotFilter);
            hotFilterValInput.addEventListener('blur', applyHotFilter);
        }

        // 每次打开数量变化事件
        const openLimitInput = panel.querySelector('#checker-open-limit');
        openLimitInput.addEventListener('change', (e) => {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val) || val < 1) {
                val = 5;
            }
            openBatchSize = val;
            e.target.value = val;
            localStorage.setItem('checker-panel-open-batch', openBatchSize);
        });

        // 打开异常/失效链接按钮事件
        const openFailedBtn = panel.querySelector('#checker-btn-open-failed');
        openFailedBtn.addEventListener('click', () => {
            openFailedLinks();
        });

        // 复制异常链接列表按钮事件
        const copyFailedBtn = panel.querySelector('#checker-btn-copy-failed');
        if (copyFailedBtn) {
            copyFailedBtn.addEventListener('click', () => {
                copyFailedLinks();
            });
        }

        // 定位跳转下一个异常链接按钮事件
        const jumpNextBtn = panel.querySelector('#checker-btn-jump-next');
        if (jumpNextBtn) {
            jumpNextBtn.addEventListener('click', () => {
                scrollToNextFailed();
            });
        }

        // 开始/暂停按钮
        const toggleBtn = panel.querySelector('#checker-btn-toggle');
        toggleBtn.addEventListener('click', () => {
            if (isRunning) {
                stopDetection(false);
            } else {
                startDetection();
            }
        });

        // 重置按钮（仅重置检测状态，不重新解析 DOM，避免触发网站的 DOM 变更监听）
        const resetBtn = panel.querySelector('#checker-btn-reset');
        resetBtn.addEventListener('click', () => {
            stopDetection(false);
            localStorage.removeItem(getCacheKey());
            lastHighlightIndex = -1;
            searchKeyword = '';
            if (searchInput) searchInput.value = '';
            if (searchClear) searchClear.classList.remove('show');

            // 原地重置每个 item 的状态，避免 parseLinks() 的 DOM 删除/重建操作
            items.forEach(item => {
                item.status = 'pending';
                item.detail = '';
                item.opened = false;
                item.checkedAt = null;
                item.badge.className = 'checker-badge badge-pending';
                item.badge.title = '等待检测';
                item.badge.classList.remove('badge-opened');
                item.li.classList.remove('checker-target-highlight');
            });
            queue = [];
            stats = {
                total: items.length,
                pending: items.length,
                checking: 0,
                success: 0,
                warning: 0,
                error: 0,
                ratelimit: 0,
                github: 0,
                duplicate: items.filter(i => i.duplicate).length
            };
            applyFilterAll();
            updateStatsUI();
            showToast("已重置所有检测状态");
        });
    }

    // 恢复控制面板的位置，并做越界安全检查
    function restorePosition(panel) {
        let right = localStorage.getItem('checker-panel-right');
        let top = localStorage.getItem('checker-panel-top');

        if (right !== null && top !== null) {
            right = parseFloat(right);
            top = parseFloat(top);

            const panelWidth = 240;
            const maxRight = window.innerWidth - panelWidth;
            const maxTop = window.innerHeight - 50;

            if (right < 0) right = 0;
            if (right > maxRight) right = maxRight;
            if (top < 0) top = 0;
            if (top > maxTop) top = maxTop;

            panel.style.right = right + 'px';
            panel.style.top = top + 'px';
            panel.style.left = 'auto';
        } else {
            // 默认紧贴屏幕最右侧
            panel.style.right = '0px';
            panel.style.top = '100px';
            panel.style.left = 'auto';
        }
    }

    // 初始化拖拽交互
    function initDrag(panel) {
        const header = panel.querySelector('.checker-header');
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;
        let hasMoved = false;

        // 鼠标按下事件
        const onMouseDown = (e) => {
            // 展开状态下只能通过 header 拖动，最小化状态下可以拖动整个面板
            const isMin = panel.classList.contains('minimized');
            if (!isMin) {
                // 如果是展开状态，点击的不是 header 及其子元素，则不触发拖拽
                if (!header.contains(e.target)) return;
            }

            // 如果点击的是按钮、输入框、复选框等交互元素，不触发拖拽
            const targetTagName = e.target.tagName.toLowerCase();
            if (targetTagName === 'input' ||
                targetTagName === 'button' ||
                targetTagName === 'a' ||
                targetTagName === 'select' ||
                e.target.closest('.checker-toggle-min') ||
                e.target.closest('.checker-slider-round') ||
                e.target.closest('.checker-accordion-header')) {
                return;
            }

            isDragging = true;
            hasMoved = false;
            startX = e.clientX;
            startY = e.clientY;

            // 获取当前的 left 和 top 坐标
            const rect = panel.getBoundingClientRect();
            startLeft = rect.left;
            startTop = rect.top;

            // 临时修改 panel 定位为 left/top 模式，以便于平滑移动
            panel.style.left = startLeft + 'px';
            panel.style.top = startTop + 'px';
            panel.style.right = 'auto';

            // 绑定 document 的移动与释放事件，防止鼠标划出面板后丢失
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        // 鼠标移动事件
        const onMouseMove = (e) => {
            if (!isDragging) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                hasMoved = true;
            }

            let newLeft = startLeft + dx;
            let newTop = startTop + dy;

            // 边界检测
            const panelWidth = panel.offsetWidth;
            const panelHeight = panel.offsetHeight;

            if (newLeft < 0) newLeft = 0;
            if (newLeft > window.innerWidth - panelWidth) newLeft = window.innerWidth - panelWidth;
            if (newTop < 0) newTop = 0;
            if (newTop > window.innerHeight - panelHeight) newTop = window.innerHeight - panelHeight;

            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
        };

        // 鼠标释放事件
        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;

            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            // 获取最终位置并转换为基于右侧定位
            const rect = panel.getBoundingClientRect();
            let right = window.innerWidth - rect.right;
            let top = rect.top;

            // 确保 right 和 top 是有效值
            if (right < 0) right = 0;
            if (top < 0) top = 0;

            // 应用回基于 right 定位，防止切换折叠/展开状态时漂移
            panel.style.left = 'auto';
            panel.style.right = right + 'px';
            panel.style.top = top + 'px';

            // 保存到本地
            localStorage.setItem('checker-panel-right', right);
            localStorage.setItem('checker-panel-top', top);

            // 如果拖动了，阻止可能触发的 click 事件（主要针对折叠状态的点击展开）
            if (hasMoved) {
                const preventClick = (e) => {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                };
                document.addEventListener('click', preventClick, { capture: true, once: true });
            }
        };

        // 监听面板的 mousedown
        panel.addEventListener('mousedown', onMouseDown);

        // 窗口大小改变时，重新计算边界并调整面板位置，确保不越界
        window.addEventListener('resize', () => {
            if (!isDragging) {
                restorePosition(panel);
            }
        });
    }

    // 4. 更新统计界面和进度条
    function updateStatsUI() {
        const elTitleTotal = document.getElementById('checker-title-total');
        if (elTitleTotal) elTitleTotal.innerText = `共 ${stats.total} 条`;

        const elTotal = document.getElementById('stat-total');
        if (elTotal) elTotal.innerText = stats.total;

        const elPending = document.getElementById('stat-pending');
        if (elPending) elPending.innerText = stats.pending;

        const elChecking = document.getElementById('stat-checking');
        if (elChecking) elChecking.innerText = stats.checking;

        const elSuccess = document.getElementById('stat-success');
        if (elSuccess) elSuccess.innerText = stats.success;

        const elWarning = document.getElementById('stat-warning');
        if (elWarning) elWarning.innerText = stats.warning;

        const elError = document.getElementById('stat-error');
        if (elError) elError.innerText = stats.error;

        const rlEl = document.getElementById('stat-ratelimit');
        if (rlEl) rlEl.innerText = stats.ratelimit;

        const ghEl = document.getElementById('stat-github');
        if (ghEl) ghEl.innerText = stats.github;

        const dupEl = document.getElementById('stat-duplicate');
        if (dupEl) dupEl.innerText = stats.duplicate;

        const checkedCount = stats.total - stats.pending - stats.checking;
        const elCheckedCount = document.getElementById('stat-checked-count');
        if (elCheckedCount) elCheckedCount.innerText = checkedCount;

        const progressPercent = stats.total > 0 ? Math.round((checkedCount / stats.total) * 100) : 0;
        const elProgressPct = document.getElementById('checker-progress-pct');
        if (elProgressPct) elProgressPct.innerText = `(${progressPercent}%)`;

        const progressFill = document.getElementById('checker-progress-fill');
        if (progressFill) progressFill.style.width = `${progressPercent}%`;

        // 更新一键打开按钮状态（区分未打开数、当前标签页总数与全局总数）
        const unOpenedFailed = items.filter(item =>
            (item.status === 'warning' || item.status === 'error') && !item.opened && isItemInActiveTab(item)
        ).length;
        const totalFailedInTab = items.filter(item =>
            (item.status === 'warning' || item.status === 'error') && isItemInActiveTab(item)
        ).length;
        const totalFailedGlobal = stats.warning + stats.error;

        const openFailedBtn = document.getElementById('checker-btn-open-failed');
        if (openFailedBtn) {
            if (totalFailedInTab > 0) {
                openFailedBtn.disabled = false;
                if (unOpenedFailed > 0) {
                    openFailedBtn.innerHTML = `打开异常/失效网站 (<span id="checker-open-remaining">${unOpenedFailed}</span>/${totalFailedInTab})`;
                    openFailedBtn.title = `每次打开 ${openBatchSize} 个，剩余 ${unOpenedFailed} 个未打开（当前分类共 ${totalFailedInTab} 个）`;
                } else {
                    openFailedBtn.innerHTML = `重新打开异常网站 (<span id="checker-open-remaining">${totalFailedInTab}</span>)`;
                    openFailedBtn.title = `当前分类 ${totalFailedInTab} 个异常网站均已打开过，点击可重新批量打开`;
                }
            } else if (totalFailedGlobal > 0) {
                openFailedBtn.disabled = true;
                openFailedBtn.innerHTML = `当前分类无异常 (其他分类 <span id="checker-open-remaining">${totalFailedGlobal}</span>)`;
                openFailedBtn.title = `当前标签页暂无异常链接，切换到其他标签页后即可批量打开（其他分类共 ${totalFailedGlobal} 个）`;
            } else {
                openFailedBtn.disabled = true;
                openFailedBtn.innerHTML = `打开异常/失效网站 (<span id="checker-open-remaining">0</span>)`;
                openFailedBtn.title = `暂无异常/失效网站`;
            }
        }

        // 更新悬浮球未读角标（统计全部未打开的异常/失效/限流/GitHub）
        const totalAbnormal = stats.warning + stats.error + stats.ratelimit + stats.github;
        const minBadge = document.getElementById('checker-min-badge');
        if (minBadge) {
            if (totalAbnormal > 0) {
                minBadge.innerText = totalAbnormal > 99 ? '99+' : totalAbnormal;
                minBadge.classList.remove('hidden');
            } else {
                minBadge.classList.add('hidden');
            }
        }

        // 更新次级实用按钮可用状态
        const copyFailedBtn = document.getElementById('checker-btn-copy-failed');
        const jumpNextBtn = document.getElementById('checker-btn-jump-next');
        const totalAbnormalInTab = items.filter(item => isAbnormalStatus(item.status) && isItemInActiveTab(item)).length;
        if (copyFailedBtn) copyFailedBtn.disabled = totalAbnormalInTab === 0;
        if (jumpNextBtn) jumpNextBtn.disabled = totalAbnormalInTab === 0;

        // 更新面板底部检测时间（最近一次完成检测的时间）
        let lastCheckTs = null;
        items.forEach(item => {
            if (item.checkedAt && (!lastCheckTs || item.checkedAt > lastCheckTs)) {
                lastCheckTs = item.checkedAt;
            }
        });
        const lastTimeEl = document.getElementById('checker-last-time');
        if (lastTimeEl) {
            lastTimeEl.innerText = '检测时间: ' + (lastCheckTs ? formatTime(lastCheckTs) : '—');
        }
    }

    // 判断状态是否属于异常范畴
    function isAbnormalStatus(status) {
        return status === 'warning' || status === 'error' || status === 'ratelimit' || status === 'github';
    }

    // 5. 过滤显示逻辑
    function applyFilterSingle(item) {
        let show = true;

        // 0. 重复网址过滤优先于状态过滤
        if (showDuplicatesOnly) {
            show = item.duplicate === true;
        } else if (selectedStatuses.size > 0) {
            // 1. 按选中的状态分类过滤（如果有选中项，则只显示选中的状态）
            if (!selectedStatuses.has(item.status)) {
                show = false;
            }
        }

        // 2. 热度过滤
        if (show && hotFilterType !== 'none') {
            const hotness = item.hotness || 0;
            if (hotFilterType === 'less') {
                if (hotness >= hotFilterVal) {
                    show = false;
                }
            } else if (hotFilterType === 'gte') {
                if (hotness < hotFilterVal) {
                    show = false;
                }
            }
        }

        // 3. 关键词搜索过滤 (匹配 标题、原始 URL、详情/状态、hover 描述)
        if (show && searchKeyword) {
            const kw = searchKeyword.toLowerCase();
            const title = (item.a.innerText || item.a.title || '').toLowerCase();
            const url = (item.url || '').toLowerCase();
            const desc = (item.li.getAttribute('title') || '').toLowerCase();
            const detail = (item.detail || '').toLowerCase();
            if (!title.includes(kw) && !url.includes(kw) && !desc.includes(kw) && !detail.includes(kw)) {
                show = false;
            }
        }

        if (show) {
            item.li.classList.remove('checker-filtered-hidden');
        } else {
            item.li.classList.add('checker-filtered-hidden');
        }
    }

    function applyFilterAll() {
        items.forEach(item => {
            applyFilterSingle(item);
        });
    }

    function applyHotnessVisibility() {
        items.forEach(item => {
            if (item.hotBadge) {
                if (showHotness) {
                    item.hotBadge.classList.remove('hidden');
                } else {
                    item.hotBadge.classList.add('hidden');
                }
            }
        });
    }

    // 检查链接项是否在当前可见的标签页/分类中
    function isItemInActiveTab(item) {
        let parent = item.li.parentElement;
        while (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent);
            if (style.display === 'none') {
                return false;
            }
            parent = parent.parentElement;
        }
        return true;
    }

    // 获取当前页面的缓存 Key
    function getCacheKey() {
        return `checker-results-cache-${window.location.pathname}`;
    }

    // 规范化 URL，用于重复网址检测
    function normalizeUrl(u) {
        if (!u) return '';
        try {
            const url = new URL(u);
            const host = url.hostname.replace(/^www\./i, '').toLowerCase();
            let path = url.pathname.replace(/\/+$/, '');
            if (!path) path = '/';
            return host + path + url.search;
        } catch (e) {
            let s = u.trim().toLowerCase();
            s = s.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
            s = s.replace(/\/+$/, '');
            return s || '';
        }
    }

    // 格式化检测时间
    function formatTime(ts) {
        if (!ts) return '—';
        const d = new Date(ts);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    // 显示轻量 Toast 提示框
    let toastTimer = null;
    function showToast(msg) {
        let toast = document.querySelector('.checker-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'checker-toast';
            document.body.appendChild(toast);
        }
        toast.innerText = msg;
        toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // 复制异常链接列表到剪贴板
    function copyFailedLinks() {
        const failedItems = items.filter(item => isAbnormalStatus(item.status) && isItemInActiveTab(item));
        if (failedItems.length === 0) {
            showToast("当前可见标签页中无异常链接");
            return;
        }

        const lines = failedItems.map((item, idx) => {
            const title = (item.a.innerText || item.a.title || '未知站点').trim();
            return `${idx + 1}. ${title} | [${item.detail || item.status}] | ${item.url}`;
        });

        const textToCopy = `【收库助手 - 异常/失效链接清单】(共 ${failedItems.length} 条)\n` + lines.join('\n');

        if (typeof GM_setClipboard === 'function') {
            GM_setClipboard(textToCopy);
            showToast(`已复制 ${failedItems.length} 条异常链接至剪贴板`);
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(`已复制 ${failedItems.length} 条异常链接至剪贴板`);
            }).catch(() => {
                fallbackCopy(textToCopy, failedItems.length);
            });
        } else {
            fallbackCopy(textToCopy, failedItems.length);
        }
    }

    function fallbackCopy(text, count) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast(`已复制 ${count} 条异常链接至剪贴板`);
        } catch (e) {
            showToast("复制失败，请手动打开控制台复制");
            console.log(text);
        }
        document.body.removeChild(textarea);
    }

    // 平滑滚动定位至下一个异常链接
    function scrollToNextFailed() {
        const failedItems = items.filter(item => isAbnormalStatus(item.status) && isItemInActiveTab(item));
        if (failedItems.length === 0) {
            showToast("当前可见标签页中无异常链接");
            return;
        }

        lastHighlightIndex = (lastHighlightIndex + 1) % failedItems.length;
        const target = failedItems[lastHighlightIndex];

        // 清理上一个高亮
        document.querySelectorAll('.checker-target-highlight').forEach(el => el.classList.remove('checker-target-highlight'));

        // 平滑居中滚动
        target.li.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.li.classList.add('checker-target-highlight');

        const title = (target.a.innerText || target.a.title || '未知').trim();
        showToast(`[${lastHighlightIndex + 1}/${failedItems.length}] ${title} (${target.detail || target.status})`);
    }

    // 保存检测结果到缓存
    function saveCache() {
        const cacheKey = getCacheKey();
        const cacheData = {
            timestamp: Date.now(),
            results: {}
        };
        items.forEach(item => {
            if (item.status !== 'pending' && item.status !== 'checking') {
                cacheData.results[item.url] = {
                    status: item.status,
                    detail: item.detail,
                    opened: item.opened,
                    checkedAt: item.checkedAt
                };
            }
        });
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }

    // 从缓存恢复检测结果
    function loadCache() {
        const cacheKey = getCacheKey();
        const cacheStr = localStorage.getItem(cacheKey);
        if (!cacheStr) return;

        try {
            const cacheData = JSON.parse(cacheStr);
            // 缓存有效期 2 小时 (7200000 毫秒)
            if (Date.now() - cacheData.timestamp > 2 * 60 * 60 * 1000) {
                localStorage.removeItem(cacheKey);
                return;
            }

            const results = cacheData.results;
            items.forEach(item => {
                const cached = results[item.url];
                if (cached) {
                    item.status = cached.status;
                    item.detail = cached.detail;
                    item.opened = cached.opened || false;
                    item.checkedAt = cached.checkedAt || null;

                    // 更新 DOM 指示器状态
                    item.badge.className = `checker-badge badge-${item.status}`;
                    const cachedTimeStr = item.checkedAt ? `\n检测时间: ${formatTime(item.checkedAt)}` : '';
                    if (item.opened) {
                        item.badge.classList.add('badge-opened');
                        item.badge.title = `[已打开] 状态: ${item.detail}${cachedTimeStr}\n地址: ${item.url}`;
                    } else {
                        item.badge.title = `状态: ${item.detail}${cachedTimeStr}\n地址: ${item.url}`;
                    }
                }
            });

            // 重新计算统计数据
            stats.total = items.length;
            stats.pending = items.filter(i => i.status === 'pending').length;
            stats.checking = 0;
            stats.success = items.filter(i => i.status === 'success').length;
            stats.warning = items.filter(i => i.status === 'warning').length;
            stats.error = items.filter(i => i.status === 'error').length;
            stats.ratelimit = items.filter(i => i.status === 'ratelimit').length;
            stats.github = items.filter(i => i.status === 'github').length;
            stats.duplicate = items.filter(i => i.duplicate).length;

            // 重新应用显示隐藏过滤
            applyFilterAll();
        } catch (e) {
            console.error('[收库助手] 解析缓存失败:', e);
        }
    }

    // 一键打开异常/失效网站
    function openFailedLinks() {
        let failedItems = items.filter(item =>
            (item.status === 'warning' || item.status === 'error') && !item.opened && isItemInActiveTab(item)
        );

        // 如果当前分类中的所有异常链接均已打开过，则重置已打开状态并重新开始批量打开
        if (failedItems.length === 0) {
            const allFailedInTab = items.filter(item =>
                (item.status === 'warning' || item.status === 'error') && isItemInActiveTab(item)
            );
            if (allFailedInTab.length > 0) {
                allFailedInTab.forEach(item => {
                    item.opened = false;
                    item.badge.classList.remove('badge-opened');
                });
                failedItems = allFailedInTab;
                showToast("已重置已打开标记，开始重新批量打开");
            } else {
                showToast("当前可见标签页中无异常/失效链接，请切换分类");
                return;
            }
        }

        const toOpen = failedItems.slice(0, openBatchSize);
        toOpen.forEach(item => {
            item.opened = true;
            // 使用 GM_openInTab 后台打开
            if (typeof GM_openInTab === 'function') {
                GM_openInTab(item.url, { active: false, insert: true, setParent: true });
            } else {
                window.open(item.url, '_blank');
            }

            // 改变 badge 样式表示已打开
            item.badge.classList.add('badge-opened');
            const openedTimeStr = item.checkedAt ? `\n检测时间: ${formatTime(item.checkedAt)}` : '';
            item.badge.title = `[已打开] 状态: ${item.detail}${openedTimeStr}\n地址: ${item.url}`;
        });

        updateStatsUI();
        saveCache();
    }

    // 判断是否为 GitHub 相关网址
    function isGitHubUrl(u) {
        if (!u) return false;
        try {
            const parsed = new URL(u);
            const host = parsed.hostname.toLowerCase();
            return host === 'github.com' || host.endsWith('.github.com') || host === 'raw.githubusercontent.com' || host === 'gist.github.com';
        } catch (e) {
            return /github\.com/i.test(u) || /githubusercontent\.com/i.test(u);
        }
    }

    // 6. 网络检测请求 (GM_xmlhttpRequest 避开 CORS 限制)
    function checkUrl(url) {
        const isGh = isGitHubUrl(url);
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 6000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "*/*"
                },
                onload: function (response) {
                    const status = response.status;
                    const headers = response.responseHeaders || '';
                    const body = response.responseText || '';
                    // Cloudflare 人机验证：网站实际存活，仅因请求无法执行 JS 验证被拦截，判定为正常
                    const isCfChallenge = /cf-mitigated:\s*challenge/i.test(headers) ||
                        (status >= 400 && /server:\s*cloudflare/i.test(headers) &&
                            (body.includes('Just a moment') || body.includes('cf_chl') || body.includes('challenge-platform')));
                    if (status >= 200 && status < 400) {
                        resolve({ status: 'success', detail: `${status} OK` });
                    } else if (isGh) {
                        // GitHub 网址在国内易受干扰，非 2xx/3xx 判定为 GitHub 异常
                        resolve({ status: 'github', detail: `GitHub HTTP ${status} (${response.statusText || 'Error'})` });
                    } else if (status === 429) {
                        const isCfLimit = /server:\s*cloudflare/i.test(headers);
                        resolve({ status: 'ratelimit', detail: `HTTP 429 限流${isCfLimit ? ' (Cloudflare)' : ''}` });
                    } else if (isCfChallenge) {
                        resolve({ status: 'success', detail: `HTTP ${status} Cloudflare 人机验证` });
                    } else {
                        resolve({ status: 'warning', detail: `HTTP ${status} (${response.statusText || 'Error'})` });
                    }
                },
                onerror: function (error) {
                    if (isGh) {
                        resolve({ status: 'github', detail: 'GitHub 连接异常 (国内网络受限/DNS解析失败)' });
                    } else {
                        resolve({ status: 'error', detail: '连接拒绝或DNS解析失败 (Connection Error)' });
                    }
                },
                ontimeout: function () {
                    if (isGh) {
                        resolve({ status: 'github', detail: 'GitHub 连接超时 (国内网络波动/6s 超时)' });
                    } else {
                        resolve({ status: 'error', detail: '连接超时 (6s 超时)' });
                    }
                }
            });
        });
    }

    // 7. 并发检测控制
    async function startDetection() {
        if (isRunning) return;
        isRunning = true;

        // 如果上次已经测完了，或者完全是初始状态，做一次重置
        const isFinished = queue.length === 0 && stats.pending === 0 && stats.checking === 0;
        if (isFinished) {
            queue = [...items];
            stats.pending = items.length;
            stats.checking = 0;
            stats.success = 0;
            stats.warning = 0;
            stats.error = 0;
            stats.ratelimit = 0;
            stats.github = 0;
            stats.duplicate = items.filter(i => i.duplicate).length;
            items.forEach(item => {
                item.status = 'pending';
                item.opened = false;
                item.checkedAt = null;
                item.badge.className = 'checker-badge badge-pending';
                item.badge.title = '等待检测';
                item.li.classList.remove('checker-target-highlight');
            });
            applyFilterAll();
        } else if (queue.length === 0 && (stats.pending > 0 || stats.checking > 0)) {
            // 继续未完成的部分（主要是暂停后恢复）
            queue = items.filter(item => item.status === 'pending');
        }

        updateStatsUI();

        // 改变按钮状态与悬浮球运行状态
        const toggleBtn = document.getElementById('checker-btn-toggle');
        if (toggleBtn) {
            toggleBtn.innerText = '暂停检测';
            toggleBtn.classList.add('btn-running');
        }
        const panel = document.getElementById('checker-panel');
        if (panel) panel.classList.add('running');

        // 启动 Workers
        adjustWorkers();
    }

    function stopDetection(isFinished = false) {
        isRunning = false;
        const toggleBtn = document.getElementById('checker-btn-toggle');
        if (toggleBtn) {
            toggleBtn.innerText = isFinished ? '重新检测' : '开始检测';
            toggleBtn.classList.remove('btn-running');
        }
        const panel = document.getElementById('checker-panel');
        if (panel) panel.classList.remove('running');
    }

    function adjustWorkers() {
        if (!isRunning) return;
        const activeWorkers = stats.checking;
        const targetWorkers = Math.min(maxConcurrency, queue.length + activeWorkers);
        if (targetWorkers > activeWorkers) {
            for (let i = 0; i < targetWorkers - activeWorkers; i++) {
                runWorker();
            }
        }
    }

    async function runWorker() {
        while (queue.length > 0 && isRunning) {
            // 动态调节并发：如果当前线程过多，则自然退出
            if (stats.checking >= maxConcurrency) {
                break;
            }

            const item = queue.shift();
            if (!item) break;

            // 更新为检测中
            item.status = 'checking';
            item.badge.className = 'checker-badge badge-checking';
            item.badge.title = '正在检测连接...';
            stats.pending--;
            stats.checking++;
            updateStatsUI();

            const result = await checkUrl(item.url);

            // 更新检测结果
            item.status = result.status;
            item.detail = result.detail;
            item.checkedAt = Date.now();
            item.badge.className = `checker-badge badge-${result.status}`;
            item.badge.title = `状态: ${result.detail}\n地址: ${item.url}\n检测时间: ${formatTime(item.checkedAt)}`;

            stats.checking--;
            stats[result.status]++;
            updateStatsUI();

            // 根据过滤模式即时应用显示/隐藏
            applyFilterSingle(item);
            saveCache();
        }

        // 队列清空且无活跃请求时，检测结束
        if (stats.checking === 0 && queue.length === 0 && isRunning) {
            stopDetection(true);
            showToast("所有链接检测完成！");
        }
    }

    // 8. 脚本加载初始化
    setTimeout(() => {
        parseLinks();
        loadCache();
        createPanel();
        updateStatsUI();
        applyFilterAll();

        // 监听页面标签页切换，重新计算统计数据和过滤显示
        document.addEventListener('click', (e) => {
            const tabEl = e.target.closest('.nav a, .nav-tabs a, [role="tab"], [data-toggle="tab"], [data-bs-toggle="tab"], .tab-nav a');
            if (tabEl) {
                setTimeout(() => {
                    updateStatsUI();
                    applyFilterAll();
                }, 200);
            }
        }, true);
    }, 1000); // 延迟 1 秒以确保页面异步链接渲染完成
})();
