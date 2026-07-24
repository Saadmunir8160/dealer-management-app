# Build from repo folder: backend/
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/DealerManagement.Domain/*.csproj DealerManagement.Domain/
COPY src/DealerManagement.Shared/*.csproj DealerManagement.Shared/
COPY src/DealerManagement.Persistence/*.csproj DealerManagement.Persistence/
COPY src/DealerManagement.Application/*.csproj DealerManagement.Application/
COPY src/DealerManagement.Infrastructure/*.csproj DealerManagement.Infrastructure/
COPY src/DealerManagement.Api/*.csproj DealerManagement.Api/

RUN dotnet restore DealerManagement.Api/DealerManagement.Api.csproj

COPY src/DealerManagement.Domain/ DealerManagement.Domain/
COPY src/DealerManagement.Shared/ DealerManagement.Shared/
COPY src/DealerManagement.Persistence/ DealerManagement.Persistence/
COPY src/DealerManagement.Application/ DealerManagement.Application/
COPY src/DealerManagement.Infrastructure/ DealerManagement.Infrastructure/
COPY src/DealerManagement.Api/ DealerManagement.Api/

RUN dotnet publish DealerManagement.Api/DealerManagement.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "DealerManagement.Api.dll"]
