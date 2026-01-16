## Summary

Added icon size token integration to Alert.tsx:

1. **New `iconSize` prop**: Optional override for icon size using IconSize type ('xs', 'sm', 'md', 'lg', 'xl', '2xl')
2. **ALERT_ICON_SIZE constant**: Default icon size of 'md' (20px) for balanced alert context
3. **Token-based sizing**: Both main icon and close button now use resolved token-based sizing
4. **Import updated**: Changed from `ICON_SIZES` constant to `IconSize` type for semantic sizing
5. **Backward compatible**: Existing usage works unchanged - iconSize is optional with sensible default

The implementation ensures icons in alerts use consistent token-based sizing aligned with the design system.
