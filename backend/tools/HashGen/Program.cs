using System;

Console.WriteLine(BCrypt.Net.BCrypt.HashPassword(args.Length > 0 ? args[0] : "Admin@123", workFactor: 11));
