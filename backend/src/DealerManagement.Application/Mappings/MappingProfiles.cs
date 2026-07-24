using AutoMapper;
using DealerManagement.Application.DTOs.Auth;
using DealerManagement.Application.DTOs.Dealer;
using DealerManagement.Application.DTOs.Order;
using DealerManagement.Domain.Entities.Auth;
using DealerManagement.Domain.Entities.Dealer;
using DealerManagement.Domain.Entities.Product;
using DealerManagement.Domain.Entities.Sales;

namespace DealerManagement.Application.Mappings;

public class AuthProfile : Profile
{
    public AuthProfile()
    {
        CreateMap<User, UserDto>()
            .ForMember(d => d.Roles, opt => opt.MapFrom(s => s.UserRoles.Select(ur => ur.Role.RoleName).ToList()));
        CreateMap<RegisterRequest, User>();
    }
}

public class DealerProfile : Profile
{
    public DealerProfile()
    {
        CreateMap<Domain.Entities.Dealer.Dealer, DealerDto>()
            .ForMember(d => d.Addresses, opt => opt.MapFrom(s => s.Addresses))
            .ForMember(d => d.Contacts, opt => opt.MapFrom(s => s.Contacts));
        CreateMap<DealerAddress, DealerAddressDto>();
        CreateMap<DealerContact, DealerContactDto>();
        CreateMap<CreateDealerRequest, Domain.Entities.Dealer.Dealer>();
        CreateMap<CreateDealerAddressRequest, DealerAddress>();
        CreateMap<CreateDealerContactRequest, DealerContact>();
    }
}

public class OrderProfile : Profile
{
    public OrderProfile()
    {
        CreateMap<Order, OrderDto>()
            .ForMember(d => d.DealerName, opt => opt.MapFrom(s => s.Dealer.DealerName))
            .ForMember(d => d.Items, opt => opt.MapFrom(s => s.OrderItems));
        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(d => d.ProductName, opt => opt.MapFrom(s => s.Product.ProductName))
            .ForMember(d => d.ProductCode, opt => opt.MapFrom(s => s.Product.ProductCode));
        CreateMap<CreateOrderRequest, Order>();
        CreateMap<CreateOrderItemRequest, OrderItem>();

        CreateMap<Domain.Entities.Product.Product, ProductDto>()
            .ForMember(d => d.CategoryName, opt => opt.MapFrom(s => s.Category.CategoryName))
            .ForMember(d => d.BrandName, opt => opt.MapFrom(s => s.Brand != null ? s.Brand.BrandName : null));
    }
}
