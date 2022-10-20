FROM mcr.microsoft.com/dotnet/sdk:6.0
RUN apt-get update -y
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs ffmpeg
RUN corepack enable 
WORKDIR /app/GaleriePhotos/ClientApp
COPY GaleriePhotos/ClientApp/yarn.lock .
COPY GaleriePhotos/ClientApp/package.json .
RUN yarn install

WORKDIR /app/GaleriePhotos
COPY GaleriePhotos/GaleriePhotos.csproj .
RUN dotnet restore GaleriePhotos.csproj

WORKDIR /app/
COPY . .

WORKDIR /app/GaleriePhotos/ClientApp/
RUN yarn build

WORKDIR /app/
RUN dotnet publish -c Release -o /output

WORKDIR /output
COPY nginx.conf.sigil .
ENTRYPOINT [ "dotnet", "GaleriePhotos.dll"]
