$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$services = @(
  @{
    Name = 'auth-service'
    Path = 'microservices\auth-service'
    Command = @(
      '$env:MONGO_URI=''mongodb://localhost/eventrent-auth''',
      '$env:JWT_SECRET=''secret''',
      'npm start'
    )
  },
  @{
    Name = 'event-service'
    Path = 'microservices\event-service'
    Command = @(
      '$env:MONGO_URI=''mongodb://localhost/events''',
      '$env:JWT_SECRET=''secret''',
      'npm start'
    )
  },
  @{
    Name = 'traiteur-service'
    Path = 'microservices\traiteur-service'
    Command = @(
      '$env:MONGO_URI=''mongodb://localhost/eventrent-traiteurs''',
      '$env:JWT_SECRET=''secret''',
      'npm start'
    )
  },
  @{
    Name = 'reservation-service'
    Path = 'microservices\reservation-service'
    Command = @(
      '$env:MONGO_URI=''mongodb://localhost/eventrent-reservations''',
      '$env:JWT_SECRET=''secret''',
      'npm start'
    )
  },
  @{
    Name = 'notification-service'
    Path = 'microservices\notification-service'
    Command = @(
      '$env:MONGO_URI=''mongodb://localhost/eventrent-notifications''',
      '$env:JWT_SECRET=''secret''',
      'npm start'
    )
  },
  @{
    Name = 'view-service'
    Path = 'microservices\view-service'
    Command = @(
      '$env:JWT_SECRET=''secret''',
      'npm start'
    )
  },
  @{
    Name = 'api-gateway'
    Path = 'microservices\api-gateway'
    Command = @(
      'node index.js'
    )
  },
  @{
    Name = 'frontend'
    Path = 'frontend'
    Command = @(
      'npm start'
    )
  }
)

foreach ($service in $services) {
  $servicePath = Join-Path $projectRoot $service.Path
  $commandParts = @(
    "Set-Location -LiteralPath '$servicePath'"
    $service.Command
  )
  $command = $commandParts -join '; '

  Start-Process powershell -ArgumentList @(
    '-NoExit',
    '-Command',
    $command
  ) -WorkingDirectory $servicePath
}

Write-Host 'Les services et le frontend ont ete lances dans des fenetres separees.'
Write-Host 'Verifiez que MongoDB est demarre avant utilisation.'
