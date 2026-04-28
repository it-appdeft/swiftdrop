import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md shadow-sm">
                <AppLogoIcon className="size-5 fill-current text-white" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-sm leading-none font-semibold">SwiftDrop</span>
                <span className="text-muted-foreground mt-0.5 truncate text-xs">Operations console</span>
            </div>
        </>
    );
}
