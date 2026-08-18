<?php

namespace App\Providers;

use App\Contracts\Auth\OtpFlowServiceInterface;
use App\Contracts\Auth\OtpServiceInterface;
use App\Contracts\Auth\RegistrationServiceInterface;
use App\Contracts\Sms\SmsGateway;
use App\Repositories\Contracts\OtpCodeRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\OtpCodeRepository;
use App\Repositories\Eloquent\UserRepository;
use App\Services\Auth\OtpFlowService;
use App\Services\Auth\OtpService;
use App\Services\Auth\RegistrationService;
use App\Services\Sms\LogSmsGateway;
use App\Services\Sms\TwilioSmsGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->bindSmsGateway();
        $this->bindRepositories();
        $this->bindServices();
    }

    public function boot(): void
    {
        //
    }

    protected function bindSmsGateway(): void
    {
        $this->app->singleton(SmsGateway::class, function ($app) {
            $driver = $app['config']->get('services.sms.default', 'log');

            return match ($driver) {
                'twilio' => new TwilioSmsGateway(
                    accountSid: (string) $app['config']->get('services.twilio.sid'),
                    authToken: (string) $app['config']->get('services.twilio.token'),
                    from: (string) $app['config']->get('services.twilio.from'),
                    messagingServiceSid: $app['config']->get('services.twilio.messaging_service_sid'),
                ),
                default => new LogSmsGateway(),
            };
        });
    }

    protected function bindRepositories(): void
    {
        $this->app->bind(OtpCodeRepositoryInterface::class, OtpCodeRepository::class);
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
    }

    protected function bindServices(): void
    {
        $this->app->bind(OtpServiceInterface::class, OtpService::class);
        $this->app->bind(OtpFlowServiceInterface::class, OtpFlowService::class);
        $this->app->bind(RegistrationServiceInterface::class, RegistrationService::class);
        $this->app->bind(
            \App\Contracts\Profile\CustomerProfileServiceInterface::class,
            \App\Services\Profile\CustomerProfileService::class,
        );
        $this->app->bind(
            \App\Contracts\Profile\DriverProfileServiceInterface::class,
            \App\Services\Profile\DriverProfileService::class,
        );
        $this->app->bind(
            \App\Contracts\Customer\CustomerDashboardServiceInterface::class,
            \App\Services\Customer\CustomerDashboardService::class,
        );
        $this->app->bind(
            \App\Contracts\Customer\CustomerSearchServiceInterface::class,
            \App\Services\Customer\CustomerSearchService::class,
        );
        $this->app->bind(
            \App\Contracts\Customer\CustomerRestaurantServiceInterface::class,
            \App\Services\Customer\CustomerRestaurantService::class,
        );
        $this->app->bind(
            \App\Contracts\Customer\CustomerCartServiceInterface::class,
            \App\Services\Customer\CustomerCartService::class,
        );
        $this->app->bind(
            \App\Contracts\Customer\CheckoutServiceInterface::class,
            \App\Services\Customer\CheckoutService::class,
        );
        $this->app->bind(
            \App\Contracts\Customer\CustomerFavoriteServiceInterface::class,
            \App\Services\Customer\CustomerFavoriteService::class,
        );
        $this->app->bind(
            \App\Contracts\Customer\OrderTrackingServiceInterface::class,
            \App\Services\Customer\OrderTrackingService::class,
        );
        $this->app->bind(
            \App\Contracts\Customer\ActiveOrderServiceInterface::class,
            \App\Services\Customer\ActiveOrderService::class,
        );
        $this->app->bind(
            \App\Contracts\Driver\DriverDashboardServiceInterface::class,
            \App\Services\Driver\DriverDashboardService::class,
        );
        $this->app->bind(
            \App\Contracts\Restaurant\RestaurantOrderServiceInterface::class,
            \App\Services\Restaurant\RestaurantOrderService::class,
        );
        $this->app->bind(
            \App\Contracts\Support\SupportTicketServiceInterface::class,
            \App\Services\Support\SupportTicketService::class,
        );
        $this->app->singleton(\App\Services\Files\ImageUploadService::class);
        $this->app->singleton(\App\Services\Platform\PlatformConfigService::class);
    }
}
