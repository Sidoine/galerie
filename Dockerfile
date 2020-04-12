FROM mcr.microsoft.com/dotnet/core/sdk:3.1
RUN apt-get update -y
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash -
RUN apt-get install -y nodejs

WORKDIR /app

COPY . .
WORKDIR /app/
RUN dotnet publish -c Release -o /output
WORKDIR /output
COPY nginx.conf.sigil .
ENTRYPOINT [ "dotnet", "GaleriePhoto.dll"]
