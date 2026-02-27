#!/bin/bash
# Radiants cmux sidebar theme — Moon Mode (Dark)
# Applies Radiants design tokens to cmux chrome via macOS defaults
#
# Usage: bash cmux-theme.sh
# Note: Restart cmux after running for changes to take effect.

APP_ID="com.cmuxterm.app"

# Appearance
defaults write $APP_ID appearanceMode -string "dark"
defaults write $APP_ID browserThemeMode -string "dark"

# Sidebar — ink base with sun-yellow tint
defaults write $APP_ID sidebarTintHex -string "#FCE184"
defaults write $APP_ID sidebarTintOpacity -string "0.06"
defaults write $APP_ID sidebarBlurOpacity -int 1
defaults write $APP_ID sidebarCornerRadius -int 0
defaults write $APP_ID sidebarMaterial -string "sidebar"
defaults write $APP_ID sidebarPreset -string "nativeSidebar"
defaults write $APP_ID sidebarBlendMode -string "withinWindow"
defaults write $APP_ID sidebarActiveTabIndicatorStyle -string "solidFill"

# Workspace tab color palette — replace defaults with Radiants brand colors
defaults write $APP_ID "workspaceTabColor.customColors" -array \
  "#FCE184" \
  "#FCC383" \
  "#FF6B63" \
  "#95BAD2" \
  "#CEF5CA" \
  "#EF5C6F" \
  "#3D2E1A" \
  "#0F0E0C"

echo "Radiants theme applied to cmux."
echo "Restart cmux for changes to take effect."
