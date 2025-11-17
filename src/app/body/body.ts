import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-body',
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './body.html',
  styleUrl: './body.css',
})
export class Body {
  slides = [
    {
      img: "https://i.ytimg.com/vi/MecD9f8Dj6s/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLCu4eIkz_yqzeI-6dlXHrRCbf2i1w",
      link: "https://www.youtube.com/watch?v=MecD9f8Dj6s"
    },
    {
      img: "https://i.ytimg.com/vi/VNpxBcYZZjQ/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLBxucgI_5xsBsbYqL3fPm7ewnMB2w",
      link: "https://www.youtube.com/watch?v=VNpxBcYZZjQ"
    },
    {
      img: "https://i.ytimg.com/vi/0pqyYN9LIgA/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLB8LQef5khhkVpP-UrMTsTlMdH-QA",
      link: "https://www.youtube.com/watch?v=0pqyYN9LIgA"
    },
    {
      img: "https://i.ytimg.com/vi/nls2tWrKCLA/hqdefault.jpg?sqp=-oaymwEnCNACELwBSFryq4qpAxkIARUAAIhCGAHYAQHiAQoIGBACGAY4AUAB&rs=AOn4CLB6AOySOl8S0UU3oTOYsZFfLpI0UQ",
      link: "https://www.youtube.com/watch?v=nls2tWrKCLA"
    }
  ];
}
