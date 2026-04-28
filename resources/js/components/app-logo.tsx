import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md shadow-sm">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="truncate text-sm leading-none font-semibold">SwiftDrop</span>
                <span className="text-muted-foreground mt-1 truncate text-[10px] font-medium tracking-[0.16em] uppercase">
                    Fresh food · Fast delivery
                </span>
            </div>
        </>
    );
}
