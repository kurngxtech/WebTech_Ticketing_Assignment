import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./home/header/header";
import { Navbar } from "./home/navbar/navbar";
import { Body } from "./home/body/body";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Navbar, Body],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Adri');
}
