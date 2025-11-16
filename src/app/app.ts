import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
<<<<<<< HEAD
import { Header } from "./header/header";
import { Navbar } from "./navbar/navbar";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Navbar],
=======

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
>>>>>>> 80cc03a1137e3f5b22f673c512d2dcd7de1964bd
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
<<<<<<< HEAD
  protected readonly title = signal('Adri');
=======
  protected readonly title = signal('web-ass-ticket');
>>>>>>> 80cc03a1137e3f5b22f673c512d2dcd7de1964bd
}
