from django.db import migrations


def copy_existing_ad_photos(apps, schema_editor):
    Ad = apps.get_model('ads', 'Ad')
    AdPhoto = apps.get_model('ads', 'AdPhoto')

    for ad in Ad.objects.all().only('id', 'photo', 'photo2', 'photo3'):
        for sort_order, image in enumerate([ad.photo, ad.photo2, ad.photo3]):
            if image:
                AdPhoto.objects.get_or_create(
                    ad_id=ad.id,
                    sort_order=sort_order,
                    defaults={'image': image.name},
                )


def delete_copied_ad_photos(apps, schema_editor):
    AdPhoto = apps.get_model('ads', 'AdPhoto')
    AdPhoto.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('ads', '0007_adstatushistory_adphoto'),
    ]

    operations = [
        migrations.RunPython(copy_existing_ad_photos, delete_copied_ad_photos),
    ]
