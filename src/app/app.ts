import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from "./header/header";
import { Navbar } from "./navbar/navbar";
import { Body } from "./body/body";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Navbar, Body],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Adri');
}
