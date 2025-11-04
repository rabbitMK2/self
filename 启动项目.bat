@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

REM 切换到脚本所在目录，确保无论从哪里运行都能正确定位项目文件
cd /d "%~dp0"

echo ========================================
echo   网站项目启动脚本
echo ========================================
echo.
echo [信息] 当前工作目录: %CD%
echo.

REM 检查 Node.js 是否安装
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [信息] 检测到 Node.js
node --version
echo.

REM 检查 pnpm 是否安装
set use_npm=0
where pnpm >nul 2>&1
if errorlevel 1 (
    echo [警告] 未检测到 pnpm，正在安装...
    call npm install -g pnpm >nul 2>&1
    if errorlevel 1 (
        echo [错误] pnpm 安装失败
        echo [提示] 将尝试使用 npm 代替 pnpm 运行项目
        set use_npm=1
    ) else (
        echo [成功] pnpm 安装完成
        timeout /t 2 /nobreak >nul
    )
)

REM 验证 pnpm 是否可用 - 使用最简单的方式
if !use_npm! equ 0 (
    where pnpm >nul 2>&1
    if errorlevel 1 (
        echo [警告] pnpm 未正确安装，将使用 npm 代替
        set use_npm=1
    ) else (
        echo [信息] pnpm 已安装并可用
        REM 确保变量正确设置
        set use_npm=0
    )
)

REM 确保脚本继续执行，添加分隔
echo.

REM 检查是否已安装依赖，以及关键依赖是否存在
set need_install=0
if not exist "node_modules" (
    set need_install=1
    echo [信息] 检测到 node_modules 目录不存在，需要安装依赖...
) else (
    REM 检查关键依赖 vite 是否存在
    if not exist "node_modules\vite\bin\vite.js" (
        set need_install=1
        echo [警告] 检测到关键依赖 vite 缺失，需要重新安装依赖...
        echo [提示] 将删除旧的 node_modules 目录并重新安装...
        timeout /t 2 /nobreak >nul
        rd /s /q "node_modules" 2>nul
        if exist "pnpm-lock.yaml" (
            del /q "pnpm-lock.yaml" 2>nul
        )
        if exist "package-lock.json" (
            del /q "package-lock.json" 2>nul
        )
    ) else (
        echo [信息] 依赖已安装，跳过安装步骤
    )
)
echo.

REM 如果需要安装依赖，执行安装
if !need_install! equ 1 (
    echo [信息] 正在安装依赖，请稍候...
    if !use_npm! equ 1 (
        echo [提示] 使用 npm 安装依赖...
        call npm install
        if errorlevel 1 (
            echo [错误] 依赖安装失败，请检查网络连接和权限
            pause
            exit /b 1
        )
    ) else (
        echo [提示] 使用 pnpm 安装依赖...
        call pnpm install
        if errorlevel 1 (
            echo [错误] pnpm 安装依赖失败，尝试使用 npm...
            set use_npm=1
            call npm install
            if errorlevel 1 (
                echo [错误] 依赖安装失败，请检查网络连接和权限
                pause
                exit /b 1
            )
        )
    )
    
    REM 再次验证关键依赖是否安装成功
    if not exist "node_modules\vite\bin\vite.js" (
        echo [错误] 依赖安装后仍未找到 vite，请检查 package.json 和网络连接
        pause
        exit /b 1
    )
    
    echo [成功] 依赖安装完成！
    echo.
)

echo [信息] 正在启动开发服务器...
echo [提示] 访问地址:
echo    - 大众版 (无编辑权限): http://localhost:3200
echo    - 内部版 (有编辑权限): http://localhost:3200/admin
echo.
echo [提示] 按 Ctrl+C 可停止服务器
echo ========================================
echo.

REM 启动开发服务器
if !use_npm! equ 1 (
    echo [提示] 使用 npm 启动项目...
    call npm run dev:client
    set "server_exit_code=!errorlevel!"
) else (
    echo [提示] 使用 pnpm 启动项目...
    call pnpm run dev
    set "server_exit_code=!errorlevel!"
)

REM 如果到这里说明服务器已停止
echo.
echo [提示] 服务器已停止
pause
endlocal
exit /b 0
