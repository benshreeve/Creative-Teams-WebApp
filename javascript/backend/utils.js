/**
 * New node file
 */

module.exports =
{
	is_dup: function(list, item) {
		items = list.split(',');
		console.log("items:", items, items.length);
		console.log("item:", item);
		if (items.length > 0) {
			for (i=0; i < items.length; i++) {
				console.log("item, i", item, items[i]);
				if (items[i] == item)
					return true;
			}
		}
		return false;
	},

	is_equal: function(list1, list2) {
		if (list1.length != list2.length)
			return false;
		items1 = list1.split(',').sort();
		items2 = list2.split(',').sort();
		for (i=0; i < items1.length; i++) {
			if (items1[i] != items2[i])
				return false;
		}
		return true;
	}
		
		
};